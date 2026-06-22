import { Task } from '../types/task';

export async function fetchTasksFromAPI(): Promise<Task[]> {
  try {
    const response = await fetch('https://jsonplaceholder.typicode.com/todos?_limit=5');
    const data = await response.json();
    
    return data.map((item: any) => ({
      id: item.id.toString(),
      title: item.title,
      description: 'Ky task u ngarkua automatikisht nga API publike.',
      status: item.completed ? 'completed' : 'pending',
      createdAt: new Date().toISOString(),
    }));
  } catch (error) {
    console.error(error);
    return [];
  }
}
