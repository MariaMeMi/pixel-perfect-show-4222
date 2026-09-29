import * as React from 'react'
import { Body, Container, Head, Heading, Html, Preview, Section, Text } from '@react-email/components'
import type { TemplateEntry } from './registry'

interface Props {
  lang?: 'en' | 'de'
  kind?: 'redness' | 'botox_information' | 'routine'
  score?: number
  summary?: string
  points?: string[]
}

const T = {
  en: {
    preview: 'Your Rose AI results',
    redness: 'Your Rosacea AI results',
    botox: 'Your Botox AI results',
    routine: 'Your personal skin plan',
    routineNotes: 'Your routine',
    score: 'Visible redness score',
    notes: 'What we noticed',
    note: 'Rose AI shares general wellness information only. It does not diagnose any condition and is not medical advice. Please speak with a qualified professional about your skin.',
  },
  de: {
    preview: 'Deine Rose AI Ergebnisse',
    redness: 'Deine Rosacea AI Ergebnisse',
    botox: 'Deine Botox AI Ergebnisse',
    routine: 'Dein persönlicher Hautplan',
    routineNotes: 'Deine Routine',
    score: 'Sichtbarer Rötungswert',
    notes: 'Was uns aufgefallen ist',
    note: 'Rose AI teilt nur allgemeine Wellness-Informationen. Es stellt keine Diagnose und ist keine medizinische Beratung. Bitte sprich mit einer qualifizierten Fachperson über deine Haut.',
  },
}

const Email = ({ lang = 'en', kind = 'redness', score, summary, points = [] }: Props) => {
  const t = T[lang] ?? T.en
  return (
    <Html lang={lang} dir="ltr">
      <Head />
      <Preview>{t.preview}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Text style={brand}>Rose AI</Text>
          <Heading style={h1}>{kind === 'routine' ? t.routine : kind === 'botox_information' ? t.botox : t.redness}</Heading>
          {typeof score === 'number' ? (
            <Section style={card}>
              <Text style={eyebrow}>{t.score}</Text>
              <Text style={big}>{score}/100</Text>
            </Section>
          ) : null}
          {summary ? <Text style={text}>{summary}</Text> : null}
          {points.length ? (
            <>
              <Text style={eyebrow}>{kind === 'routine' ? t.routineNotes : t.notes}</Text>
              {points.slice(0, 6).map((p, i) => (
                <Text key={i} style={text}>• {p}</Text>
              ))}
            </>
          ) : null}
          <Text style={small}>{t.note}</Text>
        </Container>
      </Body>
    </Html>
  )
}

export const template = {
  component: Email,
  subject: (d: Record<string, any>) =>
    d['lang'] === 'de' ? 'Deine Rose AI Ergebnisse 🌹' : 'Your Rose AI results 🌹',
  displayName: 'Analysis results',
  previewData: {
    lang: 'en',
    kind: 'redness',
    score: 62,
    summary: 'Mild visible redness, mostly across the cheeks.',
    points: ['Redness is most visible on the cheeks.', 'The chin looks calm today.'],
  },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: 'Georgia, Arial, sans-serif' }
const container = { padding: '28px 24px', maxWidth: '520px' }
const brand = { color: '#b5586a', fontSize: '13px', letterSpacing: '2px', textTransform: 'uppercase' as const, margin: 0 }
const h1 = { color: '#3a2a2c', fontSize: '26px', fontWeight: 'normal', margin: '8px 0 20px' }
const card = { backgroundColor: '#fbf1ef', borderRadius: '16px', padding: '16px 20px', margin: '0 0 16px' }
const eyebrow = { color: '#8a7274', fontSize: '12px', textTransform: 'uppercase' as const, letterSpacing: '1px', margin: '12px 0 4px' }
const big = { color: '#b5586a', fontSize: '32px', margin: 0 }
const text = { color: '#4a3a3c', fontSize: '15px', lineHeight: '1.6', margin: '4px 0' }
const small = { color: '#9a8a8c', fontSize: '12px', lineHeight: '1.5', marginTop: '28px' }
