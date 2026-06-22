import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  StyleSheet,
  TextInput,
  TouchableOpacity,
} from 'react-native';
import Toast from 'react-native-toast-message';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator, NativeStackScreenProps } from '@react-navigation/native-stack';
import { Task } from './src/types/task';
import { fetchTasksFromAPI } from './src/services/taskService';

type RootStackParamList = {
  Home: undefined;
  Details: { task: Task };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

const TASKS_STORAGE_KEY = '@pritech_tasks';

async function saveTasks(tasks: Task[]): Promise<void> {
  try {
    await AsyncStorage.setItem(TASKS_STORAGE_KEY, JSON.stringify(tasks));
  } catch (error) {
    console.error('Failed to save tasks to storage', error);
  }
}

type HomeScreenProps = NativeStackScreenProps<RootStackParamList, 'Home'>;
type DetailsScreenProps = NativeStackScreenProps<RootStackParamList, 'Details'>;

function HomeScreen({ navigation }: HomeScreenProps) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');

  useEffect(() => {
    const loadTasks = async () => {
      try {
        const storedTasks = await AsyncStorage.getItem(TASKS_STORAGE_KEY);
        if (storedTasks !== null) {
          setTasks(JSON.parse(storedTasks));
        } else {
          const fetchedTasks = await fetchTasksFromAPI();
          setTasks(fetchedTasks);
        }
      } catch (error) {
        console.error('Failed to load tasks from storage', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadTasks();
  }, []);

  useEffect(() => {
    if (isLoading) {
      return;
    }

    saveTasks(tasks);
  }, [tasks, isLoading]);

  const handleAddTask = () => {
    const title = newTitle.trim();
    const description = newDescription.trim();

    if (!title) {
      Toast.show({
        type: 'error',
        text1: 'Titulli është i zbrazët',
        text2: 'Ju lutemi shkruani një titull para se të shtoni taskun.',
      });
      return;
    }

    const newTask: Task = {
      id: Date.now().toString(),
      title,
      description: description || 'Pa përshkrim.',
      status: 'pending',
      createdAt: new Date().toISOString(),
    };

    setTasks([newTask, ...tasks]);
    setNewTitle('');
    setNewDescription('');

    Toast.show({
      type: 'success',
      text1: 'Task u shtua',
      text2: 'Tasku juaj u shtua me sukses.',
    });
  };

  const deleteTask = (id: string) => {
    setTasks((prevTasks) => prevTasks.filter((task) => task.id !== id));

    Toast.show({
      type: 'info',
      text1: 'Tasku u fshi',
      text2: 'Tasku u largua nga lista.',
    });
  };

  const toggleStatus = (id: string) => {
    setTasks((prevTasks) =>
      prevTasks.map((task) =>
        task.id === id
          ? { ...task, status: task.status === 'completed' ? 'pending' : 'completed' }
          : task
      )
    );
  };

  const renderTaskCard = ({ item }: { item: Task }) => (
    <View style={styles.taskCard}>
      <TouchableOpacity onPress={() => navigation.navigate('Details', { task: item })} activeOpacity={0.8}>
        <Text style={styles.taskTitle}>{item.title}</Text>
        <Text style={styles.taskDescription}>{item.description}</Text>
        <View style={styles.taskFooter}>
          <View style={styles.taskFooterLeft}>
            <Text
              style={[
                styles.taskStatus,
                item.status === 'completed' ? styles.statusCompleted : styles.statusPending,
              ]}
            >
              {item.status}
            </Text>
            <Text style={styles.taskDate}>{new Date(item.createdAt).toLocaleDateString()}</Text>
          </View>
        </View>
      </TouchableOpacity>
      <View style={styles.taskActions}>
        <TouchableOpacity style={styles.toggleButton} onPress={() => toggleStatus(item.id)}>
          <Text style={styles.toggleButtonText}>{item.status === 'completed' ? 'Mark Pending' : 'Mark Done'}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.deleteButton} onPress={() => deleteTask(item.id)}>
          <Text style={styles.deleteButtonText}>Delete</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  if (isLoading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#4f46e5" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Pritech Task Manager</Text>
      <View style={styles.formContainer}>
        <TouchableOpacity style={styles.addButton} onPress={handleAddTask}>
          <Text style={styles.addButtonText}>Shto</Text>
        </TouchableOpacity>
        <TextInput
          style={styles.input}
          placeholder="Shkruaj një task të ri..."
          value={newTitle}
          onChangeText={setNewTitle}
          placeholderTextColor="#8b95a1"
        />
        <TextInput
          style={[styles.input, styles.descriptionInput]}
          placeholder="Shto një përshkrim..."
          value={newDescription}
          onChangeText={setNewDescription}
          placeholderTextColor="#8b95a1"
          multiline
        />
      </View>
      <FlatList
        data={tasks}
        renderItem={renderTaskCard}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={() => (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No tasks available</Text>
          </View>
        )}
      />
    </View>
  );
}

function DetailsScreen({ route }: DetailsScreenProps) {
  const { task } = route.params;

  return (
    <View style={styles.detailsContainer}>
      <Text style={styles.detailsTitle}>{task.title}</Text>
      <Text style={styles.detailsLabel}>Përshkrimi</Text>
      <Text style={styles.detailsText}>{task.description}</Text>
      <Text style={styles.detailsLabel}>Statusi</Text>
      <Text style={styles.detailsText}>{task.status}</Text>
      <Text style={styles.detailsLabel}>Krijuar më</Text>
      <Text style={styles.detailsText}>{new Date(task.createdAt).toLocaleString()}</Text>
    </View>
  );
}

export default function App() {
  return (
    <>
      <NavigationContainer>
        <Stack.Navigator>
          <Stack.Screen name="Home" component={HomeScreen} options={{ title: 'Pritech Task Manager' }} />
          <Stack.Screen name="Details" component={DetailsScreen} options={{ title: 'Detajet e Taskut' }} />
        </Stack.Navigator>
      </NavigationContainer>
      <Toast />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    paddingTop: 20,
  },
  header: {
    fontSize: 28,
    fontWeight: 'bold',
    paddingHorizontal: 16,
    paddingVertical: 16,
    color: '#333',
  },
  formContainer: {
    paddingHorizontal: 16,
    marginBottom: 50,
  },
  input: {
    width: '100%',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 12,
    fontSize: 16,
    color: '#1f2937',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  addButton: {
    backgroundColor: '#87A7D0',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    alignSelf: 'flex-start',
  },
  addButtonText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 16,
  },
  descriptionInput: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  taskCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  taskTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  taskDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
    lineHeight: 20,
  },
  taskFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  taskFooterLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  taskActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 12,
  },
  toggleButton: {
    backgroundColor: '#87A7D0',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  toggleButtonText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  taskStatus: {
    fontSize: 12,
    fontWeight: '600',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  deleteButton: {
    backgroundColor: '#ef4444',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  deleteButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  statusCompleted: {
    backgroundColor: '#d4edda',
    color: '#005213',
  },
  statusPending: {
    backgroundColor: '#fff3cd',
    color: '#856404',
  },
  emptyContainer: {
    alignItems: 'center',
    marginTop: 40,
  },
  emptyText: {
    color: '#666',
    fontSize: 16,
  },
  taskDate: {
    fontSize: 12,
    color: '#999',
  },
  detailsContainer: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 20,
  },
  detailsTitle: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  detailsLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#555',
    marginTop: 16,
    marginBottom: 6,
  },
  detailsText: {
    fontSize: 16,
    color: '#333',
    lineHeight: 22,
  },
});
