import React, { useState } from 'react';
import { Platform, KeyboardAvoidingView, StyleSheet, Text, View, TextInput, TouchableOpacity, Keyboard, ScrollView } from 'react-native';
import Task from './components/Task';

export default function App() {
    const [task, setTask] = useState('');
    const [taskItems, setTaskItems] = useState([]);

    const handleAddTask = () => {
        if (!task.trim()) return;
        Keyboard.dismiss();
        setTaskItems(prev => [...prev, task.trim()]);
        setTask('');
    };

    const completeTask = (index) => {
        setTaskItems(prev => prev.filter((_, i) => i !== index));
    };

    return (
        <View style={styles.container}>
            <ScrollView contentContainerStyle={{ paddingTop: 80 }} keyboardShouldPersistTaps="handled">
                <View style={styles.tasksWrapper}>
                    <Text style={styles.sectionTitle}>Today's tasks</Text>
                    <View style={styles.items}>
                        {taskItems.map((item, index) => (
                            <TouchableOpacity key={`${item}-${index}`} onPress={() => completeTask(index)}>
                                <Task text={item} />
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>
            </ScrollView>

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.writeTaskWrapper}
            >
                <TextInput
                    style={styles.input}
                    placeholder={'Write a task'}
                    value={task}
                    onChangeText={setTask}
                    returnKeyType="done"
                    onSubmitEditing={handleAddTask}
                />
                <TouchableOpacity onPress={handleAddTask}>
                    <View style={styles.addWrapper}>
                        <Text style={styles.addText}>+</Text>
                    </View>
                </TouchableOpacity>
            </KeyboardAvoidingView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#E8EAED' },
    tasksWrapper: { paddingHorizontal: 20 },
    sectionTitle: { fontSize: 24, fontWeight: 'bold' },
    items: { marginTop: 30 },
    writeTaskWrapper: {
        position: 'absolute',
        bottom: 30,
        width: '100%',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-around',
        paddingHorizontal: 20,
    },
    input: {
        paddingVertical: 15,
        paddingHorizontal: 15,
        backgroundColor: '#FFF',
        borderRadius: 60,
        borderColor: '#C0C0C0',
        borderWidth: 1,
        width: '75%',
    },
    addWrapper: {
        width: 60,
        height: 60,
        backgroundColor: '#FFF',
        borderRadius: 60,
        justifyContent: 'center',
        alignItems: 'center',
        borderColor: '#C0C0C0',
        borderWidth: 1,
    },
    addText: { fontSize: 24, lineHeight: 24, fontWeight: '600' },
});
