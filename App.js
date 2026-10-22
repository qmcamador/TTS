// App.js — searchable word list from the database.
// Tap a word to hear it.

import React, { useEffect, useState, useCallback } from 'react';

import {
  SafeAreaView,
  View,
  Text,
  TextInput,
  FlatList,
  Pressable,
  StyleSheet,
  StatusBar,
} from 'react-native';

import { getWords } from './db';
import { speakWord, stopSpeaking } from './tts';

const C = {
  bg: '#F4F6FA',
  ink: '#0B1B3A',
  muted: '#5B6784',
  line: '#D9DFEC',
  accent: '#0038A8',
  playing: '#E3EAFB',
};

export default function App() {
  const [query, setQuery] = useState('');
  const [words, setWords] = useState([]);
  const [playingId, setPlayingId] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  // Load words from the database whenever the search changes.
  useEffect(() => {
    let cancelled = false;

    setLoading(true);
    setError(null);

    getWords(query)
      .then((rows) => {
        if (!cancelled) {
          setWords(rows);
        }
      })
      .catch((e) => {
        if (!cancelled) {
          setWords([]);
          setError(`Could not read the database: ${e.message}`);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [query]);

  // Stop speech when the screen is closed.
  useEffect(() => {
    return () => {
      stopSpeaking();
    };
  }, []);

  // Play a word using tts.js.
  const onPressWord = useCallback(async (entry) => {
    try {
      setError(null);
      setPlayingId(entry.id);

      await speakWord(entry);

      // The speech may still be playing after this function returns.
      // The highlight is cleared when the user taps another word
      // or stops the speech.
    } catch (e) {
      setPlayingId(null);
      setError(
        'Could not play audio. Check your browser or device text-to-speech support.'
      );
    }
  }, []);

  const onStopSpeaking = useCallback(() => {
    stopSpeaking();
    setPlayingId(null);
  }, []);

  const renderItem = ({ item }) => (
    <Pressable
      onPress={() => onPressWord(item)}
      style={({ pressed }) => [
        styles.row,
        (pressed || playingId === item.id) && {
          backgroundColor: C.playing,
        },
      ]}
      accessibilityRole="button"
      accessibilityLabel={`Play ${item.word}${
        item.gloss ? `, ${item.gloss}` : ''
      }`}
    >
      <View style={{ flex: 1 }}>
        <Text style={styles.word}>{item.word}</Text>

        <Text style={styles.ipa}>
          {item.ipa ? `/${item.ipa}/` : ''}
          {item.gloss ? `  ${item.gloss}` : ''}
        </Text>
      </View>

      <Text style={styles.play}>
        {playingId === item.id ? 'Playing' : 'Play'}
      </Text>
    </Pressable>
  );

  return (
    <SafeAreaView style={styles.screen}>
      <StatusBar barStyle="dark-content" backgroundColor={C.bg} />

      <Text style={styles.title}>Salita</Text>

      <Text style={styles.subtitle}>
        Search Filipino words and listen to their pronunciation.
      </Text>

      <TextInput
        value={query}
        onChangeText={setQuery}
        placeholder="Search a word, e.g. basa"
        placeholderTextColor={C.muted}
        autoCapitalize="none"
        autoCorrect={false}
        style={styles.search}
        accessibilityLabel="Search words"
      />

      {error ? (
        <Text style={styles.error}>{error}</Text>
      ) : null}

      {playingId !== null ? (
        <Pressable
          onPress={onStopSpeaking}
          style={styles.stopButton}
          accessibilityRole="button"
        >
          <Text style={styles.stopText}>Stop pronunciation</Text>
        </Pressable>
      ) : null}

      {loading ? (
        <Text style={styles.empty}>Loading words...</Text>
      ) : (
        <FlatList
          data={words}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderItem}
          keyboardShouldPersistTaps="handled"
          ListEmptyComponent={
            <Text style={styles.empty}>
              {error
                ? 'Words could not be loaded.'
                : `No words found for "${query}".`}
            </Text>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: C.bg,
  },

  title: {
    fontSize: 34,
    fontWeight: '700',
    color: C.ink,
    paddingHorizontal: 20,
    paddingTop: 16,
  },

  subtitle: {
    fontSize: 14,
    color: C.muted,
    paddingHorizontal: 20,
    marginTop: 4,
  },

  search: {
    marginHorizontal: 20,
    marginTop: 20,
    marginBottom: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: C.line,
    borderRadius: 10,
    fontSize: 17,
    color: C.ink,
    backgroundColor: '#FFFFFF',
  },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: C.line,
  },

  word: {
    fontSize: 22,
    fontWeight: '600',
    color: C.ink,
  },

  ipa: {
    fontSize: 15,
    color: C.muted,
    marginTop: 2,
  },

  play: {
    fontSize: 15,
    fontWeight: '600',
    color: C.accent,
    marginLeft: 12,
  },

  stopButton: {
    alignSelf: 'flex-end',
    marginHorizontal: 20,
    marginVertical: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: C.playing,
  },

  stopText: {
    color: C.accent,
    fontWeight: '600',
  },

  error: {
    color: '#B00020',
    paddingHorizontal: 20,
    paddingBottom: 8,
  },

  empty: {
    color: C.muted,
    textAlign: 'center',
    marginTop: 40,
    marginHorizontal: 20,
    fontSize: 16,
  },
});