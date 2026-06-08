# TodoList App (Aprendizaje fullstack)

> Stack: **NestJS + TypeORM + PostgreSQL + GraphQL** (backend) · **Next.js + Apollo Client** (frontend)  
> Sin autenticación. Cada feature va de punta a punta: base de datos → API → UI.

---

## Cómo está organizado esto

Cada feature es un bloque completo. Primero tú la haces y se la explicas. Luego él la replica o hace la siguiente con tu código como ejemplo. El objetivo no es dividir trabajo sino que entienda el flujo completo: entidad → resolver → query/mutation → componente → UI.

---

## Feature 1 — Listar todos

**Concepto que aprende:** cómo viaja un dato desde la base de datos hasta el navegador.

### Backend

**Entidad `Todo`**

Crear el archivo `todo.entity.ts`:

```typescript
@Entity()
export class Todo {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column({ default: false })
  done: boolean;

  @CreateDateColumn()
  createdAt: Date;
}
```

**ObjectType GraphQL**

En `todo.model.ts` definir cómo se expone el dato:

```typescript
@ObjectType()
export class TodoType {
  @Field(() => ID)
  id: string;

  @Field()
  title: string;

  @Field()
  done: boolean;
}
```

**Resolver — Query `todos`**

```typescript
@Query(() => [TodoType])
async todos(): Promise<Todo[]> {
  return this.todoService.findAll();
}
```

**Service**

```typescript
findAll(): Promise<Todo[]> {
  return this.todoRepository.find({ order: { createdAt: 'DESC' } });
}
```

### Frontend

**Query GraphQL**

```graphql
query GetTodos {
  todos {
    id
    title
    done
  }
}
```

**Componente `TodoList`**

```tsx
const { data, loading } = useQuery(GET_TODOS);

if (loading) return <p>Cargando...</p>;

return (
  <ul>
    {data.todos.map(todo => (
      <li key={todo.id}>{todo.title}</li>
    ))}
  </ul>
);
```

---

## Feature 2 — Crear un todo

**Concepto que aprende:** mutations en GraphQL, `useMutation` en Apollo, actualizar el cache.

### Backend

**InputType**

```typescript
@InputType()
export class CreateTodoInput {
  @Field()
  title: string;
}
```

**Mutation en el Resolver**

```typescript
@Mutation(() => TodoType)
async createTodo(@Args('input') input: CreateTodoInput): Promise<Todo> {
  return this.todoService.create(input);
}
```

**Service**

```typescript
create(input: CreateTodoInput): Promise<Todo> {
  const todo = this.todoRepository.create(input);
  return this.todoRepository.save(todo);
}
```

### Frontend

**Mutation GraphQL**

```graphql
mutation CreateTodo($input: CreateTodoInput!) {
  createTodo(input: $input) {
    id
    title
    done
  }
}
```

**Formulario con `useMutation`**

```tsx
const [createTodo] = useMutation(CREATE_TODO, {
  refetchQueries: [{ query: GET_TODOS }], // re-ejecuta la query al crear
});

const handleSubmit = async (title: string) => {
  await createTodo({ variables: { input: { title } } });
};
```

> **Punto de aprendizaje:** explicarle la diferencia entre `refetchQueries` (simple, hace una nueva llamada al servidor) vs actualizar el cache manualmente con `cache.modify` (más eficiente, sin nueva llamada). Para empezar usar `refetchQueries`.

---

## Feature 3 — Marcar como completado

**Concepto que aprende:** mutations que modifican estado, actualización optimista en Apollo.

### Backend

**Mutation `toggleDone`**

```typescript
@Mutation(() => TodoType)
async toggleDone(@Args('id', { type: () => ID }) id: string): Promise<Todo> {
  return this.todoService.toggleDone(id);
}
```

**Service**

```typescript
async toggleDone(id: string): Promise<Todo> {
  const todo = await this.todoRepository.findOneByOrFail({ id });
  todo.done = !todo.done;
  return this.todoRepository.save(todo);
}
```

### Frontend

**Mutation GraphQL**

```graphql
mutation ToggleDone($id: ID!) {
  toggleDone(id: $id) {
    id
    done
  }
}
```

**Checkbox en `TodoItem`**

```tsx
const [toggleDone] = useMutation(TOGGLE_DONE);

<input
  type="checkbox"
  checked={todo.done}
  onChange={() => toggleDone({ variables: { id: todo.id } })}
/>
```

> **Punto de aprendizaje:** Apollo actualiza automáticamente el cache cuando la mutation devuelve el mismo `id` que ya existe en el cache. Por eso el checkbox cambia sin necesidad de `refetchQueries`. Esto se llama **normalized cache**.

---

## Feature 4 — Eliminar un todo

**Concepto que aprende:** mutations destructivas, limpiar el cache manualmente.

### Backend

**Mutation `deleteTodo`**

```typescript
@Mutation(() => Boolean)
async deleteTodo(@Args('id', { type: () => ID }) id: string): Promise<boolean> {
  return this.todoService.delete(id);
}
```

**Service**

```typescript
async delete(id: string): Promise<boolean> {
  await this.todoRepository.delete(id);
  return true;
}
```

### Frontend

**Mutation con actualización de cache**

```tsx
const [deleteTodo] = useMutation(DELETE_TODO, {
  update(cache, { data }) {
    cache.modify({
      fields: {
        todos(existingTodos = [], { readField }) {
          return existingTodos.filter(
            ref => readField('id', ref) !== id
          );
        },
      },
    });
  },
});
```

> **Punto de aprendizaje:** aquí sí toca actualizar el cache manualmente porque el servidor devuelve `Boolean`, no el objeto eliminado. Apollo no sabe qué ítem borrar del cache a menos que se lo diga explícitamente.

---

## Feature 5 — Editar el título

**Concepto que aprende:** formulario controlado, mutation con múltiples argumentos, edición inline.

### Backend

**InputType con campo opcional**

```typescript
@InputType()
export class UpdateTodoInput {
  @Field()
  id: string;

  @Field({ nullable: true })
  title?: string;
}
```

**Mutation `updateTodo`**

```typescript
@Mutation(() => TodoType)
async updateTodo(@Args('input') input: UpdateTodoInput): Promise<Todo> {
  return this.todoService.update(input);
}
```

**Service**

```typescript
async update(input: UpdateTodoInput): Promise<Todo> {
  await this.todoRepository.update(input.id, { title: input.title });
  return this.todoRepository.findOneByOrFail({ id: input.id });
}
```

### Frontend

**Edición inline con estado local**

```tsx
const [editing, setEditing] = useState(false);
const [value, setValue] = useState(todo.title);
const [updateTodo] = useMutation(UPDATE_TODO);

const handleSave = () => {
  updateTodo({ variables: { input: { id: todo.id, title: value } } });
  setEditing(false);
};

return editing ? (
  <input value={value} onChange={e => setValue(e.target.value)} onBlur={handleSave} autoFocus />
) : (
  <span onDoubleClick={() => setEditing(true)}>{todo.title}</span>
);
```

---

## Feature 6 — Filtrar todos (sin backend)

**Concepto que aprende:** estado local en React, que no todo requiere una llamada al servidor.

```tsx
type Filter = 'all' | 'pending' | 'done';

const [filter, setFilter] = useState<Filter>('all');

const filtered = data.todos.filter(todo => {
  if (filter === 'pending') return !todo.done;
  if (filter === 'done') return todo.done;
  return true;
});
```

> **Punto de aprendizaje:** los filtros de UI que no cambian los datos no necesitan query ni mutation. Se aplican sobre los datos ya cargados en memoria. Sólo tiene sentido ir al servidor si la lista es muy grande (paginación) o si el filtro necesita lógica de base de datos.

---

## Orden de implementación sugerido

|#|Feature|Concepto clave|
|---|---|---|
|1|Listar todos|Query, entidad, TypeORM|
|2|Crear todo|Mutation, InputType, refetchQueries|
|3|Marcar completado|Mutation, normalized cache|
|4|Eliminar|Mutation destructiva, cache.modify|
|5|Editar título|Estado local + mutation|
|6|Filtros|Estado local puro, sin API|

---

## Setup rápido

### Backend

```bash
nest new todo-api
cd todo-api
npm install @nestjs/graphql @nestjs/apollo apollo-server-express graphql
npm install @nestjs/typeorm typeorm pg
```

`app.module.ts`:

```typescript
GraphQLModule.forRoot<ApolloDriverConfig>({
  driver: ApolloDriver,
  autoSchemaFile: true,
}),
TypeOrmModule.forRoot({
  type: 'postgres',
  host: 'localhost',
  port: 5432,
  database: 'todos',
  entities: [Todo],
  synchronize: true, // solo en desarrollo
}),
```

### Frontend

```bash
npx create-next-app@latest todo-client
cd todo-client
npm install @apollo/client graphql
```

`app/layout.tsx` — envolver con `ApolloProvider`:

```tsx
const client = new ApolloClient({
  uri: 'http://localhost:3000/graphql',
  cache: new InMemoryCache(),
});

export default function RootLayout({ children }) {
  return <ApolloProvider client={client}>{children}</ApolloProvider>;
}
```