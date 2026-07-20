import { useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { NavHeader } from '@/components';
import {
  ConfirmationCard,
  RecordButton,
  TranscriptDisplay,
  VoiceStatusBar,
  Waveform,
  type RecordButtonState,
} from '@/components/voice';
import { useClient } from '@/hooks/useClient';
import { useJob } from '@/hooks/useJob';
import { theme } from '@/theme';
import { formatCurrency } from '@/utils/invoiceUtils';

type RecordingState = 'idle' | 'listening' | 'processing' | 'error';

interface ParsedJobDetails {
  clientName: string;
  amount: number;
  notes: string;
}

// MVP mock — swapped for real Whisper transcription + Claude parsing later.
// The transcript and its "parsed" result are paired mock constants rather
// than actually parsed, since there's no real recognizer yet to parse output from.
const MOCK_TRANSCRIPT = 'Create a job for John Smith, $1200 for plumbing work';
const MOCK_WORDS = MOCK_TRANSCRIPT.split(' ');
const MOCK_PARSED_JOB: ParsedJobDetails = {
  clientName: 'John Smith',
  amount: 1200,
  notes: 'Plumbing work',
};

const WORD_REVEAL_INTERVAL_MS = 120;
const FINALIZE_DELAY_MS = 300;
const PROCESSING_DELAY_MS = 3000;

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Voice-first job creation: record -> (mock) transcribe -> confirm -> save. */
export function JobCreationScreen() {
  const router = useRouter();
  const { createClient } = useClient();
  const { createJob } = useJob();

  const [recordingState, setRecordingState] = useState<RecordingState>('idle');
  const [interimText, setInterimText] = useState('');
  const [finalText, setFinalText] = useState('');
  const [confirmedData, setConfirmedData] = useState<ParsedJobDetails | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Bumped whenever a mock recording session should stop applying its
  // queued state updates — on a fresh press, or on unmount.
  const sessionRef = useRef(0);
  useEffect(
    () => () => {
      sessionRef.current += 1;
    },
    []
  );

  const handleRecordPress = useCallback(async () => {
    // 'error' is visually shown as idle (see recordButtonState below), so a
    // press there should behave like idle too — start over rather than a dead tap.
    if (recordingState !== 'idle' && recordingState !== 'error') return;

    const session = ++sessionRef.current;
    setErrorMessage(null);
    setConfirmedData(null);
    setInterimText('');
    setFinalText('');
    setRecordingState('listening');

    for (let wordCount = 1; wordCount <= MOCK_WORDS.length; wordCount++) {
      await wait(WORD_REVEAL_INTERVAL_MS);
      if (sessionRef.current !== session) return;
      setInterimText(MOCK_WORDS.slice(0, wordCount).join(' '));
    }

    await wait(FINALIZE_DELAY_MS);
    if (sessionRef.current !== session) return;
    setInterimText('');
    setFinalText(MOCK_TRANSCRIPT);
    setRecordingState('processing');

    await wait(PROCESSING_DELAY_MS);
    if (sessionRef.current !== session) return;
    setConfirmedData(MOCK_PARSED_JOB);
    setRecordingState('idle');
  }, [recordingState]);

  const handleEdit = useCallback(() => {
    sessionRef.current += 1;
    setConfirmedData(null);
    setInterimText('');
    setFinalText('');
    setErrorMessage(null);
    setRecordingState('idle');
  }, []);

  const handleRetry = useCallback(() => {
    setErrorMessage(null);
    setRecordingState('idle');
  }, []);

  const handleConfirm = useCallback(async () => {
    if (!confirmedData) return;

    setErrorMessage(null);
    setRecordingState('processing');

    const client = await createClient(confirmedData.clientName, null, null);
    if (!client) {
      setErrorMessage('Could not save this client. Please try again.');
      setRecordingState('error');
      return;
    }

    const job = await createJob({
      clientId: client.id,
      title: confirmedData.notes,
      description: null,
      workStatus: 'in-progress',
      paymentStatus: 'awaiting-payment',
      quotedAmount: confirmedData.amount,
      jobNotes: confirmedData.notes,
    });

    if (!job) {
      setErrorMessage('Could not create this job. Please try again.');
      setRecordingState('error');
      return;
    }

    router.back();
  }, [confirmedData, createClient, createJob, router]);

  // RecordButton has no 'error' visual — fall back to its idle (pressable) look
  // and let VoiceStatusBar carry the error message instead.
  const recordButtonState: RecordButtonState = recordingState === 'error' ? 'idle' : recordingState;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <NavHeader title="Create Job" onBackPress={() => router.back()} />

      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <View style={styles.recordSection}>
          <RecordButton state={recordButtonState} onPress={handleRecordPress} />
          <Waveform isActive={recordingState === 'listening'} />
        </View>

        <TranscriptDisplay
          interimText={interimText}
          finalText={finalText}
          isListening={recordingState === 'listening'}
        />

        <VoiceStatusBar
          status={recordingState}
          errorMessage={errorMessage ?? undefined}
          onRetry={handleRetry}
        />

        {confirmedData && (
          <ConfirmationCard
            title="Confirm new job"
            fields={[
              { label: 'Client', value: confirmedData.clientName },
              { label: 'Amount', value: formatCurrency(confirmedData.amount) },
              { label: 'Job notes', value: confirmedData.notes },
            ]}
            onConfirm={handleConfirm}
            onEdit={handleEdit}
          />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.background.primary,
  },
  scrollContent: {
    flexGrow: 1,
    alignItems: 'stretch',
    justifyContent: 'center',
    padding: theme.spacing[5],
    gap: theme.spacing[5],
  },
  recordSection: {
    alignItems: 'center',
    gap: theme.spacing[5],
  },
});
