import React, { useRef, useState } from 'react';
import { Platform, KeyboardAvoidingView, StyleSheet, Text, View, TextInput, TouchableOpacity, Keyboard, ScrollView, Pressable, Modal, Animated, Easing } from 'react-native';
import { GestureHandlerRootView, Swipeable } from 'react-native-gesture-handler';
import Task from './components/Task';
import 'react-native-gesture-handler';

export default function App() {
    const [task, setTask] = useState('');
    const [taskItems, setTaskItems] = useState([]);
    const [isEditing, setIsEditing] = useState(false);
    const [editingIndex, setEditingIndex] = useState(null);
    const [editingText, setEditingText] = useState('');

    // Undo state
    const [showUndo, setShowUndo] = useState(false);
    const [lastDeleted, setLastDeleted] = useState(null); // { text, index }
    const undoTimer = useRef(null);
    const undoAnim = useRef(new Animated.Value(0)).current; // 0=hidden, 1=visible

    const animateUndoIn = () => {
        setShowUndo(true);
        Animated.timing(undoAnim, {
            toValue: 1,
            duration: 180,
            easing: Easing.out(Easing.ease),
            useNativeDriver: true,
        }).start();
    };

    const animateUndoOut = (after) => {
        Animated.timing(undoAnim, {
            toValue: 0,
            duration: 180,
            easing: Easing.in(Easing.ease),
            useNativeDriver: true,
        }).start(({ finished }) => {
            if (finished) {
                setShowUndo(false);
                if (after) after();
            }
        });
    };

    const scheduleUndoAutoHide = () => {
        if (undoTimer.current) clearTimeout(undoTimer.current);
        undoTimer.current = setTimeout(() => {
            animateUndoOut(() => setLastDeleted(null));
        }, 4000);
    };

    const handleAddTask = () => {
        const t = task.trim();
        if (!t) return;
        Keyboard.dismiss();
        setTaskItems(prev => [...prev, t]);
        setTask('');
    };

    const removeTaskWithUndo = (index) => {
        setTaskItems(prev => {
            const removed = prev[index];
            const next = prev.filter((_, i) => i !== index);
            setLastDeleted({ text: removed, index });
            animateUndoIn();
            scheduleUndoAutoHide();
            return next;
        });
    };

    const undoDelete = () => {
        if (!lastDeleted) return;
        if (undoTimer.current) clearTimeout(undoTimer.current);
        const snapshot = lastDeleted;
        setTaskItems(prev => {
            const next = [...prev];
            const insertAt = Math.min(snapshot.index, next.length);
            next.splice(insertAt, 0, snapshot.text);
            return next;
        });
        setLastDeleted(null);
        animateUndoOut();
    };

    const startEdit = (index) => {
        setEditingIndex(index);
        setEditingText(taskItems[index]);
        setIsEditing(true);
    };

    const saveEdit = () => {
        const text = editingText.trim();
        if (!text) return;
        setTaskItems(prev => prev.map((t, i) => (i === editingIndex ? text : t)));
        setIsEditing(false);
        setEditingIndex(null);
        setEditingText('');
    };

    const cancelEdit = () => {
        setIsEditing(false);
        setEditingIndex(null);
        setEditingText('');
    };

    const renderLeftAction = () => (
        <View style={styles.swipeAction}>
            <Text style={styles.swipeText}>Complete</Text>
        </View>
    );

    // Animated styles for snackbar
    const undoStyle = {
        opacity: undoAnim,
        transform: [
            { translateY: undoAnim.interpolate({ inputRange: [0, 1], outputRange: [24, 0] }) },
            { scale: undoAnim.interpolate({ inputRange: [0, 1], outputRange: [0.98, 1] }) },
        ],
    };

    return (
        <GestureHandlerRootView style={{ flex: 1 }}>
            <View style={styles.container}>
                <ScrollView contentContainerStyle={{ paddingTop: 80, paddingBottom: 160 }} keyboardShouldPersistTaps="handled">
                    <View style={styles.tasksWrapper}>
                        <Text style={styles.sectionTitle}>Today's tasks</Text>
                        <View style={styles.items}>
                            {taskItems.map((item, index) => (
                                <Swipeable
                                    key={`${item}-${index}`}
                                    renderLeftActions={renderLeftAction}
                                    onSwipeableOpen={(direction) => {
                                        if (direction === 'left') removeTaskWithUndo(index); // swipe right opens left actions
                                    }}
                                >
                                    <Pressable
                                        onPress={() => startEdit(index)}
                                        android_ripple={{ radius: 120 }}
                                        accessibilityRole="button"
                                        accessibilityHint="Tap to edit, swipe right to complete"
                                    >
                                        <Task text={item} />
                                    </Pressable>
                                </Swipeable>
                            ))}
                        </View>
                    </View>
                </ScrollView>

                {/* Edit Modal */}
                <Modal visible={isEditing} transparent animationType="fade" onRequestClose={cancelEdit}>
                    <View style={styles.modalBackdrop}>
                        <View style={styles.modalCard}>
                            <Text style={styles.modalTitle}>Edit task</Text>
                            <TextInput
                                style={styles.modalInput}
                                value={editingText}
                                onChangeText={setEditingText}
                                placeholder="Task name"
                                autoFocus
                                returnKeyType="done"
                                onSubmitEditing={saveEdit}
                            />
                            <View style={styles.modalActions}>
                                <TouchableOpacity style={[styles.actionBtn, styles.cancelBtn]} onPress={cancelEdit}>
                                    <Text style={styles.actionText}>Cancel</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={[styles.actionBtn, styles.saveBtn]} onPress={saveEdit}>
                                    <Text style={[styles.actionText, styles.saveText]}>Save</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                </Modal>

                {/* Animated Undo Snackbar */}
                {showUndo && (
                    <View style={styles.undoBar} pointerEvents="box-none">
                        <Animated.View style={[styles.undoCard, undoStyle]} accessibilityRole="alert">
                            <Text style={styles.undoText}>Task completed</Text>
                            <TouchableOpacity onPress={undoDelete} accessibilityRole="button" accessibilityLabel="Undo task completion">
                                <Text style={styles.undoButtonText}>UNDO</Text>
                            </TouchableOpacity>
                        </Animated.View>
                    </View>
                )}

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
        </GestureHandlerRootView>
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
        borderRadius: 50,
        justifyContent: 'center',
        alignItems: 'center',
        borderColor: '#C0C0C0',
        borderWidth: 1,
    },
    addText: { fontSize: 24, lineHeight: 24, fontWeight: '600' },

    // Swipe action
    swipeAction: {
        justifyContent: 'center',
        alignItems: 'flex-start',
        backgroundColor: '#9ebfd3',
        paddingHorizontal: 20,
        marginBottom: 20,
        borderRadius: 50,
    },
    swipeText: { color: '#fff', fontWeight: '700' },

    // Undo snackbar
    undoBar: {
        position: 'absolute',
        bottom: 110,
        left: 0,
        right: 0,
        alignItems: 'center',
    },
    undoCard: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: '#333',
        borderRadius: 50,
        gap: 16,
        minWidth: 260,
        maxWidth: '92%',
    },
    undoText: { color: '#fff' },
    undoButtonText: { color: '#9ebfd3', fontWeight: '700' },

    // Modal
    modalBackdrop: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.4)',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
    },
    modalCard: {
        width: '100%',
        backgroundColor: '#FFF',
        borderRadius: 20,
        padding: 16,
    },
    modalTitle: { fontSize: 18, fontWeight: '600', marginBottom: 8 },
    modalInput: {
        borderWidth: 1,
        borderColor: '#C0C0C0',
        borderRadius: 50,
        paddingHorizontal: 12,
        paddingVertical: 10,
        backgroundColor: '#FFF',
    },
    modalActions: {
        marginTop: 12,
        flexDirection: 'row',
        justifyContent: 'flex-end',
        gap: 8,
    },
    actionBtn: {
        paddingVertical: 10,
        paddingHorizontal: 14,
        borderRadius: 50,
    },
    cancelBtn: {
        backgroundColor: '#EEE',
    },
    saveBtn: {
        backgroundColor: '#9ebfd3',
    },
    actionText: { fontWeight: '600' },
    saveText: { color: '#fff' },
});
