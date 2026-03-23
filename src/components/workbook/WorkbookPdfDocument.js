import React from 'react';
import { Document, Page, Text, View, StyleSheet, Image, Font } from '@react-pdf/renderer';

// Register Lexend font for dyslexia-friendly typography
Font.register({
  family: 'Lexend',
  fonts: [
    { src: 'https://fonts.gstatic.com/s/lexend/v18/Vp6vE7p_sJ6Ex6SjAm78.ttf', fontWeight: 'normal' },
    { src: 'https://fonts.gstatic.com/s/lexend/v18/Vp6vE7p_sJ6Ex6SjAn78.ttf', fontWeight: 'bold' }
  ]
});

const styles = StyleSheet.create({
  page: {
    fontFamily: 'Lexend',
    paddingTop: 80, // Header space
    paddingBottom: 60, // Footer space
    paddingHorizontal: 72, // 1-inch margins
    fontSize: 12,
    lineHeight: 1.6,
    color: '#334155',
  },
  header: {
    position: 'absolute',
    top: 30,
    left: 72,
    right: 72,
    borderBottomWidth: 1,
    borderBottomColor: '#E9ECEF',
    paddingBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
  },
  headerLeft: {
    fontSize: 11,
    color: '#475569',
  },
  headerRight: {
    fontSize: 10,
    textAlign: 'right',
    color: '#64748B',
    maxWidth: '50%',
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 72,
    right: 72,
    fontSize: 10,
    textAlign: 'center',
    color: '#94A3B8',
  },
  docTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#0F172A',
  },
  activityTitleBlock: {
    backgroundColor: '#334155',
    borderRadius: 8,
    padding: '8 16',
    marginTop: 20,
    marginBottom: 12,
  },
  activityTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  bold: {
    fontWeight: 'bold',
  },
  normal: {
    fontWeight: 'normal',
  },
  italic: {
    fontStyle: 'italic',
  },
  paragraph: {
    marginBottom: 12,
    textAlign: 'justify',
  },
  image: {
    marginVertical: 15,
    maxHeight: 300,
    objectFit: 'contain',
    borderRadius: 8,
  },
  questionContainer: {
    marginTop: 15,
    marginBottom: 5,
  },
  taskPrompt: {
    fontWeight: 'bold',
    marginBottom: 8,
  },
  studentAnswerBox: {
    width: '100%',
    minHeight: 100,
    backgroundColor: '#F8F9FA',
    borderWidth: 1,
    borderColor: '#DEE2E6',
    borderRadius: 8,
    padding: 12,
  },
  sentenceStarter: {
    fontStyle: 'italic',
    color: '#475569',
    fontSize: 11,
    marginBottom: 4,
  },
  teacherNotes: {
    backgroundColor: '#F1F5F9',
    padding: 12,
    marginTop: 10,
    fontSize: 11,
    borderLeftWidth: 3,
    borderLeftColor: '#3B82F6',
  },
});

/**
 * Trauma-Informed Answer Box Component
 */
const StudentAnswerBox = ({ sentenceStarter }) => (
  <View style={styles.studentAnswerBox}>
    {sentenceStarter && (
      <Text style={styles.sentenceStarter}>{sentenceStarter} ...</Text>
    )}
  </View>
);

/**
 * Robust Markdown Parser for PDF
 */
const renderRichText = (text) => {
  if (!text) return null;
  // Handle bold (**text**)
  const parts = text.split(/(\*\*.*?\*\*)/g);
  return (
    <Text>
      {parts.map((part, index) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return <Text key={index} style={styles.bold}>{part.slice(2, -2)}</Text>;
        }
        return <Text key={index}>{part}</Text>;
      })}
    </Text>
  );
};

export const WorkbookPdfDocument = ({ data, primarySourceImage, meta }) => {
  if (!data) return null;

  const tierLevel = data.document_metadata?.tier_level || 'Core Material';
  const topic = data.document_metadata?.topic || meta?.unitTopic || 'Educational Workbook';

  return (
    <Document>
      {/* TEACHER KEY PAGE */}
      <Page style={styles.page}>
        <View style={styles.header} fixed>
          <View style={styles.headerLeft}>
            <Text>Teacher Key</Text>
          </View>
          <View style={styles.headerRight}>
            <Text>{topic}</Text>
          </View>
        </View>

        <Text style={styles.docTitle}>Teacher Key: {tierLevel}</Text>
        
        <View style={styles.teacherNotes}>
          <Text style={styles.bold}>Expected Answers & Differentiation</Text>
          <Text style={{ marginTop: 5 }}>This key is for instructional use only. Do not distribute to students.</Text>
        </View>

        <View style={{ marginTop: 20 }}>
          {data.teacher_key && data.teacher_key.map((ans, i) => (
            <View key={i} style={{ marginBottom: 15 }}>
              <Text style={styles.bold}>{ans.question_id}. (DOK {ans.dok_level})</Text>
              <Text style={{ color: '#2563EB' }}>{ans.answer}</Text>
            </View>
          ))}
        </View>

        <Text style={styles.footer} render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`} fixed />
      </Page>

      {/* STUDENT WORKBOOK PAGE(S) */}
      <Page style={styles.page}>
        {/* Global Student Header */}
        <View style={styles.header} fixed>
          <View style={styles.headerLeft}>
            <Text>Name: _______________________  Date: __________</Text>
          </View>
          <View style={styles.headerRight}>
            <Text>{topic}</Text>
          </View>
        </View>

        {/* Global Student Footer */}
        <Text style={styles.footer} render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`} fixed />

        <Text style={styles.docTitle}>{topic}</Text>
        
        {primarySourceImage && (
          <Image src={primarySourceImage} style={styles.image} />
        )}

        {/* Reading Passage - Forced New Page */}
        {data.student_workbook?.reading_passage && (
          <View break>
            <View style={styles.activityTitleBlock}>
              <Text style={styles.activityTitle}>Reading Passage</Text>
            </View>
            <View style={styles.paragraph}>
              {renderRichText(data.student_workbook.reading_passage)}
            </View>
          </View>
        )}

        {/* Activities - Forced New Page Start */}
        {data.student_workbook?.activities && data.student_workbook.activities.map((activity, actIdx) => (
          <View key={actIdx} break={actIdx === 0}>
            <View style={styles.activityTitleBlock}>
              <Text style={styles.activityTitle}>{activity.activity_title}</Text>
            </View>
            
            {activity.required_image_description && (
              <Text style={[styles.italic, { marginBottom: 10, fontSize: 10 }]}>[Source Context: {activity.required_image_description}]</Text>
            )}

            {activity.questions && activity.questions.map((q, qIdx) => (
              <View key={qIdx} style={styles.questionContainer} wrap={false}>
                <Text style={styles.taskPrompt}>{q.question_id}. {q.prompt}</Text>
                <StudentAnswerBox sentenceStarter={q.sentence_starter} />
              </View>
            ))}
          </View>
        ))}
      </Page>
    </Document>
  );
};

