import { useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Icon, MicGlyph } from '@/components';
import { TranscriptDisplay, Waveform } from '@/components/voice';
import { useConversation } from '@/context/ConversationContext';
import { theme } from '@/theme';

type Phase = 'listening' | 'thinking' | 'clarifying' | 'confirming' | 'success';

interface ScriptStep {
  userText: string;
  assistantText: string;
  /** True once the AI has everything it needs — the step after this one is the final summary, not another question. */
  isFinal: boolean;
}

// MVP mock — mirrors the scripted-transcript approach JobCreationScreen uses
// for its own mocked flow. Two turns is enough to demonstrate the
// multi-turn/clarification loop; real Whisper + Claude wiring is a later step.
const SCRIPT: ScriptStep[] = [
  {
    userText:
      'Finished the water heater swap at the Hendersons job. Two and a half hours labor at eight hundred dollars. One Rheem forty-gallon tank, four sixty dollars. Copper fittings, thirty-five dollars. And add the disposal fee, twenty-five dollars.',
    assistantText:
      "I found an existing job for The Hendersons. Should I add these charges to that job, or create a new invoice separate from it?",
    isFinal: false,
  },
  {
    userText: 'Add it to the existing job.',
    assistantText: "Got it — here's what I'll create for The Hendersons:",
    isFinal: true,
  },
];

const MOCK_CLIENT_NAME = 'The Hendersons';
const MOCK_LINE_ITEMS: Array<{ description: string; amount: number }> = [
  { description: 'Labor (2.5 hrs)', amount: 800 },
  { description: 'Rheem 40-gallon water heater tank', amount: 460 },
  { description: 'Copper fittings', amount: 35 },
  { description: 'Disposal fee', amount: 25 },
];
const MOCK_TOTAL = MOCK_LINE_ITEMS.reduce((sum, item) => sum + item.amount, 0);

const WORD_REVEAL_INTERVAL_MS = 90;
const FINALIZE_DELAY_MS = 250;
const THINKING_DELAY_MS = 1100;
const GENERATING_DELAY_MS = 1200;

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function formatCurrency(amount: number): string {
  return amount.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
}

export function VoiceConversationScreen() {
  const router = useRouter();
  const conversation = useConversation();

  const [phase, setPhase] = useState<Phase>('listening');
  const [stepIndex, setStepIndex] = useState(0);
  const [interimText, setInterimText] = useState('');
  const [finalText, setFinalText] = useState('');
  const [assistantText, setAssistantText] = useState('');

  // Bumped on unmount/discard so any in-flight mocked timer chain stops
  // touching state — same cancellation pattern JobCreationScreen uses.
  const sessionRef = useRef(0);
  useEffect(
    () => () => {
      sessionRef.current += 1;
    },
    []
  );

  // Takes the full step as a parameter rather than reading `stepIndex` from
  // closure — `setStepIndex` (in handleHoldToReply) doesn't take effect
  // synchronously, so a closure-captured `stepIndex` would still read the
  // *previous* value for the rest of this same call, replaying the first
  // clarifying question forever instead of advancing. Passing the resolved
  // step in directly sidesteps that stale-closure risk entirely.
  const playTurn = useCallback(
    async (step: ScriptStep, session: number) => {
      const words = step.userText.split(' ');
      for (let wordCount = 1; wordCount <= words.length; wordCount++) {
        await wait(WORD_REVEAL_INTERVAL_MS);
        if (sessionRef.current !== session) return;
        setInterimText(words.slice(0, wordCount).join(' '));
      }

      await wait(FINALIZE_DELAY_MS);
      if (sessionRef.current !== session) return;
      setInterimText('');
      setFinalText(step.userText);
      conversation.addTurn('user', step.userText);

      setPhase('thinking');
      await wait(THINKING_DELAY_MS);
      if (sessionRef.current !== session) return;

      conversation.addTurn('assistant', step.assistantText);
      setAssistantText(step.assistantText);

      if (step.isFinal) {
        // This is the point a real implementation would have resolved the
        // client and parsed the line items — mocked here rather than
        // actually calling Claude or looking the client up in Supabase.
        conversation.updateSession({
          potentialClientName: MOCK_CLIENT_NAME,
          extractedEntities: {
            description: 'Water heater swap',
            amount: MOCK_TOTAL,
            lineItems: MOCK_LINE_ITEMS,
          },
        });
        // TEMPORARY — for manually verifying the phase/session state machine
        // in a real browser/simulator console (no interactive test tooling
        // in the environment this was built in). Safe to remove.
        console.log('[VoiceConversationScreen] -> confirming', conversation.session);
        setPhase('confirming');
      } else {
        console.log('[VoiceConversationScreen] -> clarifying', conversation.session);
        setPhase('clarifying');
      }
    },
    [conversation]
  );

  // Kick off the first (and only fully automatic) turn on mount — the user
  // already triggered this by holding the mic on Home, so this screen opens
  // straight into "listening" rather than waiting for a second press here.
  useEffect(() => {
    conversation.startSession('CREATE_INVOICE');
    const session = sessionRef.current;
    playTurn(SCRIPT[0], session);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleHoldToReply = useCallback(() => {
    if (phase !== 'clarifying') return;
    const nextIndex = stepIndex + 1;
    if (nextIndex >= SCRIPT.length) return;

    const session = ++sessionRef.current;
    setStepIndex(nextIndex);
    setInterimText('');
    setFinalText('');
    setAssistantText('');
    setPhase('listening');
    console.log('[VoiceConversationScreen] -> listening (reply turn)', nextIndex); // TEMPORARY, see note above
    playTurn(SCRIPT[nextIndex], session);
  }, [phase, stepIndex, playTurn]);

  const handleDiscard = useCallback(() => {
    sessionRef.current += 1;
    conversation.clearSession();
    console.log('[VoiceConversationScreen] discarded, session cleared:', conversation.session); // TEMPORARY, see note above
    router.replace('/home');
  }, [conversation, router]);

  const handleConfirm = useCallback(async () => {
    const session = ++sessionRef.current;
    setPhase('success');
    console.log('[VoiceConversationScreen] -> success, confirming session:', conversation.session); // TEMPORARY, see note above
    // Mocked "generating" delay — the real version wires this to an actual
    // Supabase write in a later step.
    await wait(GENERATING_DELAY_MS);
    if (sessionRef.current !== session) return;
    conversation.clearSession();
    router.replace('/home');
  }, [conversation, router]);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <View style={styles.topBar}>
        {phase === 'listening' ? (
          <View style={styles.listeningIndicator}>
            <View style={styles.liveDot} />
            <Text style={styles.listeningLabel}>Listening</Text>
          </View>
        ) : (
          <View />
        )}

        {phase !== 'success' && (
          <Pressable accessibilityRole="button" hitSlop={12} onPress={handleDiscard}>
            <Text style={styles.discardLabel}>Discard</Text>
          </Pressable>
        )}
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {(phase === 'listening' || phase === 'thinking') && (
          <View style={styles.listeningBlock}>
            <Waveform isActive={phase === 'listening'} color={theme.colors.text.inverse} />
            <TranscriptDisplay
              variant="dark"
              interimText={interimText}
              finalText={finalText}
              isListening={phase === 'listening'}
            />
            {phase === 'thinking' && <Text style={styles.thinkingLabel}>Billy is thinking…</Text>}
          </View>
        )}

        {(phase === 'clarifying' || phase === 'confirming' || phase === 'success') && (
          <View style={styles.responseBlock}>
            <Text style={styles.assistantText}>{assistantText}</Text>

            {(phase === 'confirming' || phase === 'success') && (
              <View style={styles.summaryCard}>
                <Text style={styles.summaryClient}>{MOCK_CLIENT_NAME}</Text>
                <View style={styles.summaryLineItems}>
                  {MOCK_LINE_ITEMS.map((item) => (
                    <View key={item.description} style={styles.summaryRow}>
                      <Text style={styles.summaryRowLabel}>{item.description}</Text>
                      <Text style={styles.summaryRowValue}>{formatCurrency(item.amount)}</Text>
                    </View>
                  ))}
                </View>
                <View style={styles.summaryTotalRow}>
                  <Text style={styles.summaryTotalLabel}>Total</Text>
                  <Text style={styles.summaryTotalValue}>{formatCurrency(MOCK_TOTAL)}</Text>
                </View>
              </View>
            )}

            {phase === 'success' && <Text style={styles.successLabel}>✓ Invoice created</Text>}
          </View>
        )}
      </ScrollView>

      {phase === 'listening' && (
        <View style={styles.releaseBar}>
          <View style={styles.releaseBarPill} />
          <Text style={styles.releaseLabel}>Release to finish</Text>
        </View>
      )}

      {phase === 'clarifying' && (
        <View style={styles.bottomBar}>
          <Pressable
            style={({ pressed }) => [styles.replyPill, pressed && styles.pillPressed]}
            onPressIn={handleHoldToReply}
            accessibilityRole="button"
            accessibilityLabel="Hold to reply">
            <MicGlyph color={theme.colors.text.inverse} size={20} />
            <Text style={styles.replyPillText}>Hold to reply</Text>
          </Pressable>
        </View>
      )}

      {phase === 'confirming' && (
        <View style={styles.bottomBar}>
          <Pressable
            style={({ pressed }) => [styles.confirmPill, pressed && styles.pillPressed]}
            onPress={handleConfirm}
            accessibilityRole="button"
            accessibilityLabel="Confirm and generate">
            <Icon name="sparkle" size={16} color="#0a0a0f" />
            <Text style={styles.confirmPillText}>Confirm and generate</Text>
          </Pressable>
        </View>
      )}
    </SafeAreaView>
  );
}

const BACKGROUND = '#0a0a0f';

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: BACKGROUND,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: theme.spacing[3],
    minHeight: 32,
  },
  listeningIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing[2],
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.colors.status.error,
  },
  listeningLabel: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: theme.colors.text.inverse,
  },
  discardLabel: {
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    color: 'rgba(255, 255, 255, 0.7)',
  },
  content: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: theme.spacing[6],
    gap: theme.spacing[5],
  },
  listeningBlock: {
    gap: theme.spacing[5],
  },
  thinkingLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.5)',
  },
  responseBlock: {
    gap: theme.spacing[5],
  },
  assistantText: {
    fontSize: 24,
    lineHeight: 32,
    fontWeight: '600',
    color: theme.colors.text.inverse,
  },
  summaryCard: {
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    borderRadius: theme.radius.lg,
    padding: theme.spacing[4],
    gap: theme.spacing[3],
  },
  summaryClient: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.text.inverse,
  },
  summaryLineItems: {
    gap: theme.spacing[2],
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: theme.spacing[3],
  },
  summaryRowLabel: {
    flex: 1,
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  summaryRowValue: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text.inverse,
  },
  summaryTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: theme.spacing[2],
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.12)',
  },
  summaryTotalLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.colors.text.inverse,
  },
  summaryTotalValue: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.text.inverse,
  },
  successLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.status.success,
  },
  releaseBar: {
    alignItems: 'center',
    paddingBottom: theme.spacing[5],
    gap: theme.spacing[2],
  },
  releaseBarPill: {
    width: 48,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
  },
  releaseLabel: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    color: 'rgba(255, 255, 255, 0.5)',
  },
  bottomBar: {
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingBottom: theme.spacing[5],
  },
  pillPressed: {
    opacity: 0.85,
  },
  replyPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing[3],
    alignSelf: 'stretch',
    justifyContent: 'center',
    height: 56,
    borderRadius: theme.radius.full,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  replyPillText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text.inverse,
  },
  confirmPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing[3],
    alignSelf: 'stretch',
    justifyContent: 'center',
    height: 56,
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.background.primary,
  },
  confirmPillText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0a0a0f',
  },
});
