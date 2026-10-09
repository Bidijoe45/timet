import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BarChart } from '@/components/charts/BarChart';
import { DonutChart } from '@/components/charts/DonutChart';
import { sessionsBetween } from '@/db/sessions';
import type { SessionRecord } from '@/db/types';
import { summarize, type Summary } from '@/features/summary/aggregate';
import { getRange, type PeriodType } from '@/features/summary/dateRange';
import { useTagStore } from '@/features/tags/tagStore';
import { formatDayLong, formatDuration, formatMonthYear, formatTime } from '@/lib/format';
import { radii, spacing, fontSize } from '@/theme/tokens';
import { useAppTheme } from '@/theme/useAppTheme';

const PERIODS: PeriodType[] = ['week', 'month', 'year'];
const SCREEN_PAD = spacing.lg;
const CARD_PAD = spacing.lg;
const UNTAGGED = { name: 'Untagged', color: '#94a3b8' };

export default function SummaryScreen() {
  const { colors } = useAppTheme();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const tags = useTagStore((s) => s.tags);

  const [periodType, setPeriodType] = useState<PeriodType>('week');
  const [offset, setOffset] = useState(0);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [sessions, setSessions] = useState<SessionRecord[]>([]);
  const [selectedBucket, setSelectedBucket] = useState<number | null>(null);

  const range = getRange(periodType, offset);
  const chartWidth = width - 2 * SCREEN_PAD - 2 * CARD_PAD;
  const tagById = new Map(tags.map((t) => [t.id, t]));

  const load = useCallback(async () => {
    const r = getRange(periodType, offset);
    const rows = await sessionsBetween(r.start, r.end);
    setSessions(rows);
    setSummary(summarize(rows, tags, r.buckets));
  }, [periodType, offset, tags]);

  useFocusEffect(
    useCallback(() => {
      load().catch(() => {});
    }, [load]),
  );

  const changePeriod = (p: PeriodType) => {
    setPeriodType(p);
    setOffset(0);
    setSelectedBucket(null);
  };
  const step = (delta: number) => {
    setOffset((o) => o + delta);
    setSelectedBucket(null);
  };

  const hasData = (summary?.sessionCount ?? 0) > 0;

  // Detail for a tapped bar.
  const bucket = selectedBucket != null ? range.buckets[selectedBucket] : null;
  const bucketSessions = bucket
    ? sessions
        .filter((s) => s.startedAt >= bucket.start && s.startedAt < bucket.end)
        .sort((a, b) => a.startedAt - b.startedAt)
    : [];
  const bucketLabel = bucket
    ? periodType === 'year'
      ? formatMonthYear(bucket.start)
      : formatDayLong(bucket.start)
    : '';
  const bucketSec = bucketSessions.reduce((sum, s) => sum + s.actualSec, 0);

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + spacing.lg, paddingBottom: insets.bottom + spacing.xxl },
        ]}>
        <Text style={[styles.title, { color: colors.fg }]}>Summary</Text>

        <View style={[styles.segment, { backgroundColor: colors.surfaceAlt }]}>
          {PERIODS.map((p) => {
            const active = p === periodType;
            return (
              <Pressable
                key={p}
                onPress={() => changePeriod(p)}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
                style={[styles.segmentBtn, active && { backgroundColor: colors.surface }]}>
                <Text style={[styles.segmentText, { color: active ? colors.accent : colors.muted }]}>
                  {p[0].toUpperCase() + p.slice(1)}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <View style={styles.nav}>
          <Pressable onPress={() => step(-1)} accessibilityRole="button" accessibilityLabel="Previous period" hitSlop={10}>
            <Ionicons name="chevron-back" size={24} color={colors.fg} />
          </Pressable>
          <Text style={[styles.navLabel, { color: colors.fg }]}>{range.label}</Text>
          <Pressable
            onPress={() => !range.isCurrent && step(1)}
            disabled={range.isCurrent}
            accessibilityRole="button"
            accessibilityLabel="Next period"
            hitSlop={10}>
            <Ionicons name="chevron-forward" size={24} color={range.isCurrent ? colors.line : colors.fg} />
          </Pressable>
        </View>

        {!hasData ? (
          <View style={styles.empty}>
            <Ionicons name="moon-outline" size={36} color={colors.muted} />
            <Text style={[styles.emptyText, { color: colors.muted }]}>No focus recorded in this period.</Text>
          </View>
        ) : (
          summary && (
            <>
              {/* Breakdown */}
              <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.line }]}>
                <View style={styles.totalHead}>
                  <Text style={[styles.totalLabel, { color: colors.muted }]}>focused</Text>
                  <Text style={[styles.totalBig, { color: colors.fg }]}>
                    {formatDuration(summary.totalSec)}
                  </Text>
                </View>
                <View style={styles.breakdown}>
                  <DonutChart
                    size={92}
                    strokeWidth={16}
                    segments={summary.perTag.map((t) => ({ value: t.sec, color: t.color }))}
                  />
                  <View style={styles.legend}>
                    {summary.perTag.map((t) => (
                      <View key={t.id} style={styles.legendRow}>
                        <View style={[styles.dot, { backgroundColor: t.color }]} />
                        <Text style={[styles.legendName, { color: colors.fg }]} numberOfLines={1}>
                          {t.name}
                        </Text>
                        <Text style={[styles.legendVal, { color: colors.muted }]}>{formatDuration(t.sec)}</Text>
                        <Text style={[styles.legendPct, { color: colors.muted }]}>
                          {Math.round(t.pct * 100)}%
                        </Text>
                      </View>
                    ))}
                  </View>
                </View>
                <Text style={[styles.cardFoot, { color: colors.muted }]}>
                  {summary.completedCount} completed · {summary.abandonedCount} given up
                </Text>
              </View>

              {/* Trend (tap a bar) */}
              <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.line }]}>
                <Text style={[styles.cardTitle, { color: colors.fg }]}>Trend</Text>
                <BarChart
                  data={summary.trend.map((b) => ({ label: b.label, value: b.sec }))}
                  width={chartWidth}
                  selected={selectedBucket}
                  onSelect={(i) => setSelectedBucket((cur) => (cur === i ? null : i))}
                />
                {bucket ? (
                  <View style={[styles.detail, { borderTopColor: colors.line }]}>
                    <View style={styles.detailHead}>
                      <Text style={[styles.detailDay, { color: colors.fg }]}>{bucketLabel}</Text>
                      <Text style={[styles.detailTotal, { color: colors.muted }]}>
                        {formatDuration(bucketSec)}
                      </Text>
                    </View>
                    {bucketSessions.length === 0 ? (
                      <Text style={[styles.detailEmpty, { color: colors.muted }]}>No sessions.</Text>
                    ) : (
                      bucketSessions.map((s) => {
                        const tag = s.tagId ? tagById.get(s.tagId) : undefined;
                        return (
                          <View key={s.id} style={styles.sessionRow}>
                            <View style={[styles.dot, { backgroundColor: tag?.color ?? UNTAGGED.color }]} />
                            <View style={styles.sessionMain}>
                              <Text style={[styles.sessionTime, { color: colors.fg }]}>
                                {formatTime(s.startedAt)} – {formatTime(s.endedAt)}
                              </Text>
                              <Text style={[styles.sessionMeta, { color: colors.muted }]} numberOfLines={1}>
                                {tag?.name ?? UNTAGGED.name}
                                {!s.completed && s.cancelReason ? ` · gave up: ${s.cancelReason}` : ''}
                              </Text>
                            </View>
                            <Text
                              style={[
                                styles.sessionDur,
                                { color: s.completed ? colors.fg : colors.danger },
                              ]}>
                              {formatDuration(s.actualSec)}
                            </Text>
                          </View>
                        );
                      })
                    )}
                  </View>
                ) : (
                  <Text style={[styles.hintTap, { color: colors.muted }]}>Tap a bar to see that day.</Text>
                )}
              </View>

              {/* Give-up stats */}
              {summary.abandonedCount > 0 && (
                <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.line }]}>
                  <Text style={[styles.cardTitle, { color: colors.fg }]}>Given up</Text>
                  <Text style={[styles.giveSub, { color: colors.muted }]}>
                    {summary.abandonedCount} session{summary.abandonedCount === 1 ? '' : 's'} ·{' '}
                    {formatDuration(summary.abandonedSec)} spent
                  </Text>
                  {summary.reasons.map((r) => (
                    <View key={r.reason} style={styles.reasonRow}>
                      <Text style={[styles.reasonName, { color: colors.fg }]} numberOfLines={1}>
                        {r.reason}
                      </Text>
                      <Text style={[styles.reasonDur, { color: colors.muted }]}>{formatDuration(r.sec)}</Text>
                      <View style={[styles.reasonBadge, { backgroundColor: colors.surfaceAlt }]}>
                        <Text style={[styles.reasonCount, { color: colors.fg }]}>×{r.count}</Text>
                      </View>
                    </View>
                  ))}
                </View>
              )}
            </>
          )
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingHorizontal: SCREEN_PAD, gap: spacing.lg },
  title: { fontSize: fontSize.display, fontWeight: '700', letterSpacing: -0.5 },
  segment: { flexDirection: 'row', borderRadius: radii.md, padding: 3 },
  segmentBtn: { flex: 1, paddingVertical: spacing.sm, borderRadius: radii.sm, alignItems: 'center' },
  segmentText: { fontSize: fontSize.small, fontWeight: '600' },
  nav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  navLabel: { fontSize: fontSize.body, fontWeight: '600', fontVariant: ['tabular-nums'] },
  empty: { alignItems: 'center', gap: spacing.md, paddingVertical: spacing.xxl * 1.5 },
  emptyText: { fontSize: fontSize.body },
  card: { borderRadius: radii.lg, borderWidth: 1, padding: CARD_PAD, gap: spacing.md },
  cardTitle: { fontSize: fontSize.body, fontWeight: '700' },
  breakdown: { flexDirection: 'row', alignItems: 'center', gap: spacing.lg, flexWrap: 'wrap' },
  legend: { flex: 1, minWidth: 150, gap: spacing.sm },
  totalHead: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' },
  totalBig: { fontSize: fontSize.display, fontWeight: '700', letterSpacing: -0.5, fontVariant: ['tabular-nums'] },
  totalLabel: { fontSize: fontSize.small, textTransform: 'uppercase', letterSpacing: 1 },
  legendRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  dot: { width: 10, height: 10, borderRadius: 5 },
  legendName: { flex: 1, fontSize: fontSize.small, fontWeight: '600' },
  legendVal: { fontSize: fontSize.caption, fontVariant: ['tabular-nums'] },
  legendPct: { fontSize: fontSize.caption, width: 34, textAlign: 'right', fontVariant: ['tabular-nums'] },
  cardFoot: { fontSize: fontSize.caption, textTransform: 'uppercase', letterSpacing: 1 },
  hintTap: { fontSize: fontSize.caption, textAlign: 'center' },
  detail: { borderTopWidth: 1, paddingTop: spacing.md, gap: spacing.sm },
  detailHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  detailDay: { fontSize: fontSize.body, fontWeight: '700' },
  detailTotal: { fontSize: fontSize.small, fontVariant: ['tabular-nums'] },
  detailEmpty: { fontSize: fontSize.small },
  sessionRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  sessionMain: { flex: 1, minWidth: 0 },
  sessionTime: { fontSize: fontSize.small, fontWeight: '600', fontVariant: ['tabular-nums'] },
  sessionMeta: { fontSize: fontSize.caption },
  sessionDur: { fontSize: fontSize.small, fontVariant: ['tabular-nums'] },
  giveSub: { fontSize: fontSize.small },
  reasonRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  reasonName: { flex: 1, fontSize: fontSize.small },
  reasonDur: { fontSize: fontSize.caption, fontVariant: ['tabular-nums'] },
  reasonBadge: { minWidth: 28, paddingHorizontal: 6, paddingVertical: 2, borderRadius: radii.pill, alignItems: 'center' },
  reasonCount: { fontSize: fontSize.caption, fontWeight: '700', fontVariant: ['tabular-nums'] },
});
