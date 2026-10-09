// The widget runtime is a standalone JS sandbox with no React Compiler runtime helpers
// (`_c`/useMemoCache) injected — opt this whole file out, or every nested helper (Countdown,
// Bar) gets compiled independently and throws the moment the widget extension calls it.
'use no memo';

import { HStack, Image, ProgressView, Spacer, Text, VStack, ZStack } from '@expo/ui/swift-ui';
import {
  clipShape,
  containerBackground,
  font,
  foregroundStyle,
  frame,
  labelsHidden,
  lineLimit,
  monospacedDigit,
  multilineTextAlignment,
  padding,
  progressViewStyle,
  tint,
} from '@expo/ui/swift-ui/modifiers';
import { createLiveActivity, type LiveActivityEnvironment } from 'expo-widgets';

export type FocusActivityStatus = 'running' | 'paused' | 'done' | 'gaveUp';

export type FocusActivityProps = {
  tagName: string;
  treeLabel: string;
  status: FocusActivityStatus;
  /** Live countdown window; only read while `status === 'running'`. */
  startEpochMs: number;
  endEpochMs: number;
  /** Static snapshot used whenever `status !== 'running'`. */
  frozenRemainingMs: number;
  progress: number;
};

// Props are JSON-serialized across the bridge into an isolated JS runtime, so
// all layout helpers must be defined *inside* this function — the `'widget'`
// directive only bundles the function body, not this module's other imports'
// runtime state (the imports themselves, being plain values, still work).
const FocusActivity = (props: FocusActivityProps, env: LiveActivityEnvironment) => {
  'widget';
  // The widget runtime is a standalone JS sandbox with no React Compiler runtime helpers
  // (`_c`/useMemoCache) injected — opt this function out or every call throws immediately.
  'use no memo';
  const isDark = env.colorScheme === 'dark';
  const accent = isDark ? '#2dd4bf' : '#0d9488';
  const fg = '#ffffff';
  const fgMuted = '#ffffffb3';

  const formatMMSS = (ms: number) => {
    const total = Math.max(0, Math.round(ms / 1000));
    const m = Math.floor(total / 60);
    const s = total % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const title =
    props.status === 'done'
      ? 'Focus complete'
      : props.status === 'gaveUp'
        ? 'Session ended'
        : props.tagName;

  const subtitle =
    props.status === 'paused'
      ? 'Paused'
      : props.status === 'done'
        ? `${props.treeLabel} planted — nice work`
        : props.status === 'gaveUp'
          ? `${props.treeLabel} withered`
          : `Growing a ${props.treeLabel}…`;

  const Countdown = ({ size, color, width }: { size: number; color: string; width: number }) =>
    props.status === 'running' ? (
      <Text
        timerInterval={{ lower: new Date(props.startEpochMs), upper: new Date(props.endEpochMs) }}
        countsDown
        modifiers={[
          font({ weight: 'semibold', size }),
          monospacedDigit(),
          foregroundStyle(color),
          multilineTextAlignment('trailing'),
          frame({ width, alignment: 'trailing' }),
        ]}
      />
    ) : (
      <Text
        modifiers={[
          font({ weight: 'semibold', size }),
          monospacedDigit(),
          foregroundStyle(color),
          multilineTextAlignment('trailing'),
          frame({ width, alignment: 'trailing' }),
        ]}>
        {formatMMSS(props.frozenRemainingMs)}
      </Text>
    );

  const Bar = () =>
    props.status === 'running' ? (
      <ProgressView
        timerInterval={{ lower: new Date(props.startEpochMs), upper: new Date(props.endEpochMs) }}
        countsDown={false}
        modifiers={[
          progressViewStyle('linear'),
          tint(accent),
          labelsHidden(),
          frame({ maxWidth: Infinity }),
        ]}
      />
    ) : (
      <ProgressView
        value={props.progress}
        modifiers={[
          progressViewStyle('linear'),
          tint(accent),
          labelsHidden(),
          frame({ maxWidth: Infinity }),
        ]}
      />
    );

  return {
    banner: (
      <ZStack modifiers={[containerBackground('#101418', 'widget'), clipShape('containerRelativeShape')]}>
        <VStack
          alignment="leading"
          spacing={10}
          modifiers={[frame({ maxWidth: Infinity, alignment: 'leading' }), padding({ all: 16 })]}>
          <HStack spacing={8}>
            <Image systemName="leaf.fill" size={16} color={accent} />
            <Text modifiers={[font({ weight: 'semibold', size: 15 }), foregroundStyle(fg)]}>{title}</Text>
            <Spacer />
            <Countdown size={20} color={fg} width={64} />
          </HStack>
          <Text modifiers={[font({ size: 13 }), foregroundStyle(fgMuted)]}>{subtitle}</Text>
          <Bar />
        </VStack>
      </ZStack>
    ),
    compactLeading: <Image systemName="leaf.fill" size={14} color={accent} />,
    compactTrailing: <Countdown size={13} color={fg} width={44} />,
    minimal: <Image systemName="leaf.fill" size={14} color={accent} />,
    expandedLeading: (
      <HStack spacing={6}>
        <Image systemName="leaf.fill" size={14} color={accent} />
        <Text modifiers={[font({ weight: 'semibold', size: 14 }), foregroundStyle(fg), lineLimit(1)]}>
          {title}
        </Text>
      </HStack>
    ),
    expandedTrailing: <Countdown size={16} color={accent} width={56} />,
    expandedBottom: (
      <VStack alignment="leading" spacing={8} modifiers={[padding({ top: 4 })]}>
        <Text modifiers={[font({ size: 12 }), foregroundStyle(fgMuted)]}>{subtitle}</Text>
        <Bar />
      </VStack>
    ),
  };
};

export default createLiveActivity<FocusActivityProps>('FocusActivity', FocusActivity);
