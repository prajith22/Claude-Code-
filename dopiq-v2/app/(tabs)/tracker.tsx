import { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Modal, KeyboardAvoidingView, Platform, FlatList, Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTracker } from '@/store/useTracker';
import { Colors, Spacing, Radius } from '@/constants/theme';
import { TrackerCategory, SpendEntry } from '@/store/types';

const CATEGORIES: TrackerCategory[] = ['Shopping', 'Food', 'Gambling', 'Other'];
const CATEGORY_EMOJI: Record<TrackerCategory, string> = {
  Shopping: '🛍️', Food: '🍔', Gambling: '🎰', Other: '💸',
};
const CATEGORY_COLOR: Record<TrackerCategory, string> = {
  Shopping: Colors.shop, Food: Colors.food, Gambling: Colors.accent, Other: Colors.textSecondary,
};

function WeeklySummary({ weekTotal, prevWeekTotal }: { weekTotal: number; prevWeekTotal: number }) {
  const diff = weekTotal - prevWeekTotal;
  const pct = prevWeekTotal === 0 ? 0 : Math.abs(diff / prevWeekTotal) * 100;
  const improved = diff <= 0;

  return (
    <View style={styles.summaryCard}>
      <Text style={styles.summaryTitle}>Weekly Summary</Text>
      <View style={styles.summaryRow}>
        <View style={styles.summaryCol}>
          <Text style={styles.summaryLabel}>This week</Text>
          <Text style={styles.summaryAmount}>${weekTotal.toFixed(2)}</Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryCol}>
          <Text style={styles.summaryLabel}>Last week</Text>
          <Text style={styles.summaryAmountSecondary}>${prevWeekTotal.toFixed(2)}</Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryCol}>
          <Text style={styles.summaryLabel}>Change</Text>
          <View style={[styles.changeBadge, { backgroundColor: improved ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)' }]}>
            <Text style={[styles.changeText, { color: improved ? Colors.success : Colors.error }]}>
              {improved ? '↓' : '↑'} {pct.toFixed(0)}%
            </Text>
          </View>
        </View>
      </View>
      {improved && prevWeekTotal > 0 && (
        <Text style={styles.motivational}>
          🎉 You spent ${Math.abs(diff).toFixed(2)} less than last week. Keep it up!
        </Text>
      )}
      {!improved && prevWeekTotal > 0 && (
        <Text style={styles.motivational}>
          💡 You spent ${Math.abs(diff).toFixed(2)} more than last week. Small steps!
        </Text>
      )}
    </View>
  );
}

function EntryRow({ entry, onDelete }: { entry: SpendEntry; onDelete: () => void }) {
  const date = new Date(entry.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  return (
    <TouchableOpacity
      style={styles.entryRow}
      onLongPress={() => Alert.alert('Delete entry?', undefined, [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: onDelete },
      ])}
      activeOpacity={0.7}
    >
      <View style={[styles.entryIcon, { backgroundColor: `${CATEGORY_COLOR[entry.category]}22` }]}>
        <Text style={styles.entryEmoji}>{CATEGORY_EMOJI[entry.category]}</Text>
      </View>
      <View style={styles.entryInfo}>
        <Text style={styles.entryCategory}>{entry.category}</Text>
        {entry.note ? <Text style={styles.entryNote} numberOfLines={1}>{entry.note}</Text> : null}
        <Text style={styles.entryDate}>{date}</Text>
      </View>
      <Text style={styles.entryAmount}>-${entry.amount.toFixed(2)}</Text>
    </TouchableOpacity>
  );
}

function AddModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const { addEntry } = useTracker();
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState<TrackerCategory>('Shopping');
  const [note, setNote] = useState('');

  const handleSave = () => {
    const num = parseFloat(amount);
    if (!num || num <= 0) { Alert.alert('Enter a valid amount'); return; }
    addEntry({ amount: num, category, date: new Date().toISOString(), note: note || undefined });
    setAmount(''); setNote(''); setCategory('Shopping');
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={onClose}><Text style={styles.modalCancel}>Cancel</Text></TouchableOpacity>
            <Text style={styles.modalTitle}>Log Spend</Text>
            <TouchableOpacity onPress={handleSave}><Text style={styles.modalSave}>Save</Text></TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.modalBody}>
            {/* Amount */}
            <Text style={styles.fieldLabel}>Amount</Text>
            <View style={styles.amountWrap}>
              <Text style={styles.amountDollar}>$</Text>
              <TextInput
                style={styles.amountInput}
                value={amount}
                onChangeText={setAmount}
                keyboardType="decimal-pad"
                placeholder="0.00"
                placeholderTextColor={Colors.textMuted}
                autoFocus
              />
            </View>

            {/* Category */}
            <Text style={styles.fieldLabel}>Category</Text>
            <View style={styles.catRow}>
              {CATEGORIES.map((c) => (
                <TouchableOpacity
                  key={c}
                  style={[styles.catChip, category === c && { borderColor: CATEGORY_COLOR[c], backgroundColor: `${CATEGORY_COLOR[c]}22` }]}
                  onPress={() => setCategory(c)}
                >
                  <Text style={styles.catEmoji}>{CATEGORY_EMOJI[c]}</Text>
                  <Text style={[styles.catLabel, category === c && { color: CATEGORY_COLOR[c] }]}>{c}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Note */}
            <Text style={styles.fieldLabel}>Note (optional)</Text>
            <TextInput
              style={styles.noteInput}
              value={note}
              onChangeText={setNote}
              placeholder="What was this for?"
              placeholderTextColor={Colors.textMuted}
              maxLength={100}
            />
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

export default function TrackerScreen() {
  const insets = useSafeAreaInsets();
  const { entries, deleteEntry, weekTotal } = useTracker();
  const [modalVisible, setModalVisible] = useState(false);

  const thisWeek = weekTotal(0);
  const lastWeek = weekTotal(-1);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Tracker</Text>
          <Text style={styles.subtitle}>Real spending only</Text>
        </View>
        <TouchableOpacity style={styles.addBtn} onPress={() => setModalVisible(true)} activeOpacity={0.85}>
          <Text style={styles.addBtnText}>+ Log</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 80 }]}
      >
        <WeeklySummary weekTotal={thisWeek} prevWeekTotal={lastWeek} />

        <Text style={styles.historyLabel}>History</Text>
        {entries.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyEmoji}>📊</Text>
            <Text style={styles.emptyTitle}>No entries yet</Text>
            <Text style={styles.emptySubt}>
              Tap "+ Log" to track real purchases or gambling spend.
            </Text>
          </View>
        ) : (
          entries.map((entry) => (
            <EntryRow key={entry.id} entry={entry} onDelete={() => deleteEntry(entry.id)} />
          ))
        )}
      </ScrollView>

      <AddModal visible={modalVisible} onClose={() => setModalVisible(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md,
  },
  title: { fontSize: 28, fontWeight: '800', color: Colors.textPrimary },
  subtitle: { fontSize: 13, color: Colors.textSecondary },
  addBtn: {
    backgroundColor: Colors.tracker, borderRadius: Radius.full,
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
  },
  addBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  scroll: { paddingHorizontal: Spacing.lg },
  summaryCard: {
    backgroundColor: Colors.bgCard, borderRadius: Radius.lg,
    padding: Spacing.lg, marginBottom: Spacing.lg,
    borderWidth: 1, borderColor: Colors.border,
  },
  summaryTitle: { fontSize: 15, fontWeight: '700', color: Colors.textPrimary, marginBottom: Spacing.md },
  summaryRow: { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.md },
  summaryCol: { flex: 1, alignItems: 'center' },
  summaryDivider: { width: 1, height: 40, backgroundColor: Colors.border },
  summaryLabel: { color: Colors.textMuted, fontSize: 11, fontWeight: '600', textTransform: 'uppercase', marginBottom: 4 },
  summaryAmount: { color: Colors.textPrimary, fontSize: 22, fontWeight: '800' },
  summaryAmountSecondary: { color: Colors.textSecondary, fontSize: 22, fontWeight: '800' },
  changeBadge: { borderRadius: Radius.sm, paddingHorizontal: 8, paddingVertical: 3 },
  changeText: { fontSize: 15, fontWeight: '700' },
  motivational: { color: Colors.textSecondary, fontSize: 13, lineHeight: 18 },
  historyLabel: { fontSize: 16, fontWeight: '700', color: Colors.textPrimary, marginBottom: Spacing.md },
  entryRow: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    backgroundColor: Colors.bgCard, borderRadius: Radius.md,
    padding: Spacing.md, marginBottom: Spacing.sm,
    borderWidth: 1, borderColor: Colors.border,
  },
  entryIcon: { width: 44, height: 44, borderRadius: Radius.md, alignItems: 'center', justifyContent: 'center' },
  entryEmoji: { fontSize: 22 },
  entryInfo: { flex: 1 },
  entryCategory: { color: Colors.textPrimary, fontWeight: '600', fontSize: 14 },
  entryNote: { color: Colors.textSecondary, fontSize: 12, marginTop: 1 },
  entryDate: { color: Colors.textMuted, fontSize: 11, marginTop: 2 },
  entryAmount: { color: Colors.error, fontWeight: '800', fontSize: 16 },
  empty: { alignItems: 'center', paddingTop: Spacing.xxl, gap: Spacing.sm },
  emptyEmoji: { fontSize: 52 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: Colors.textPrimary },
  emptySubt: { fontSize: 14, color: Colors.textSecondary, textAlign: 'center', lineHeight: 20 },
  // Modal
  modalContainer: { flex: 1, backgroundColor: Colors.bg },
  modalHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  modalCancel: { color: Colors.textSecondary, fontSize: 16 },
  modalTitle: { fontSize: 18, fontWeight: '700', color: Colors.textPrimary },
  modalSave: { color: Colors.tracker, fontSize: 16, fontWeight: '700' },
  modalBody: { padding: Spacing.lg, gap: Spacing.sm },
  fieldLabel: { color: Colors.textSecondary, fontSize: 13, fontWeight: '600', marginBottom: 4 },
  amountWrap: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.bgCard, borderRadius: Radius.md,
    borderWidth: 1.5, borderColor: Colors.tracker,
    paddingHorizontal: Spacing.md, marginBottom: Spacing.lg,
  },
  amountDollar: { color: Colors.textPrimary, fontSize: 24, fontWeight: '700', marginRight: 4 },
  amountInput: { flex: 1, color: Colors.textPrimary, fontSize: 30, fontWeight: '800', paddingVertical: Spacing.md },
  catRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginBottom: Spacing.lg },
  catChip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
    borderRadius: Radius.full, borderWidth: 1.5, borderColor: Colors.border,
    backgroundColor: Colors.bgCard,
  },
  catEmoji: { fontSize: 16 },
  catLabel: { color: Colors.textSecondary, fontSize: 13, fontWeight: '500' },
  noteInput: {
    backgroundColor: Colors.bgCard, borderRadius: Radius.md,
    borderWidth: 1, borderColor: Colors.border,
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.md,
    color: Colors.textPrimary, fontSize: 15,
  },
});
