import React from 'react';
import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer';

const styles = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica',
    padding: 40,
    fontSize: 12,
    lineHeight: 1.5,
  },
  header: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 20,
    marginBottom: 20,
    borderBottomWidth: 2,
    borderBottomColor: '#000',
    paddingBottom: 5,
  },
  sectionTitle: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 16,
    marginTop: 20,
    marginBottom: 10,
    backgroundColor: '#000',
    color: '#fff',
    padding: 5,
  },
  bold: {
    fontFamily: 'Helvetica-Bold',
  },
  normal: {
    fontFamily: 'Helvetica',
  },
  paragraph: {
    fontFamily: 'Helvetica',
    fontSize: 12,
    marginBottom: 10,
    textAlign: 'justify'
  },
  image: {
    marginVertical: 15,
    maxHeight: 300,
    objectFit: 'contain'
  },
  taskContainer: {
    marginTop: 15,
    borderWidth: 1,
    borderColor: '#000',
    padding: 10,
    borderRadius: 5,
  },
  taskPrompt: {
    fontFamily: 'Helvetica-Bold',
    marginBottom: 5
  },
  taskScaffold: {
    fontFamily: 'Helvetica-Oblique',
    marginTop: 10,
    color: '#555'
  },
  lines: {
    marginTop: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#aaa',
    height: 20,
  },
  teacherNotes: {
    backgroundColor: '#f0f0f0',
    padding: 10,
    marginTop: 10,
    fontFamily: 'Helvetica-Oblique',
  },
  list: {
    marginLeft: 10,
  },
  listItem: {
    marginBottom: 5,
  }
});

const renderPassageWithBoldWords = (text, boldWords) => {
  if (!boldWords || boldWords.length === 0) return <Text>{text}</Text>;
  
  // Create a safe regex pattern that matches any of the bold words
  const escapedWords = boldWords.map(w => w.replace(/[.*+?^${}()|[\\]\\\\]/g, '\\\\$&'));
  const regex = new RegExp(`(${escapedWords.join('|')})`, 'gi');
  
  const parts = text.split(regex);
  return (
    <Text>
      {parts.map((part, index) => {
        // Checking if the part matches any bold word (case insensitive)
        const isBold = boldWords.some(w => w.toLowerCase() === part.toLowerCase());
        return (
          <Text key={index} style={isBold ? styles.bold : styles.normal}>
            {part}
          </Text>
        );
      })}
    </Text>
  );
};

export const WorkbookPdfDocument = ({ data, primarySourceImage, meta }) => {
  if (!data) return null;

  return (
    <Document>
      {/* TEACHER KEY PAGE */}
      <Page style={styles.page}>
        <Text style={styles.header}>Teacher Key - {data.tier}</Text>
        <Text style={{ fontFamily: 'Helvetica-Bold', fontSize: 14 }}>{meta?.unitTopic || 'Topic Overview'}</Text>
        
        <Text style={styles.sectionTitle}>Expected Answers</Text>
        <View style={styles.list}>
          {data.teacher_key.expected_answers.map((ans, i) => (
            <Text key={i} style={styles.listItem}>• {ans}</Text>
          ))}
        </View>
        
        <Text style={styles.sectionTitle}>Grading Rubric & Notes</Text>
        <Text style={styles.teacherNotes}>{data.teacher_key.grading_rubric_notes}</Text>
      </Page>

      {/* STUDENT WORKBOOK PAGE(S) */}
      <Page style={styles.page}>
        <Text style={styles.header}>Student Workbook - {data.tier}</Text>
        <Text style={{ fontFamily: 'Helvetica-Bold', fontSize: 14 }}>{meta?.unitTopic || 'Topic Overview'}</Text>
        
        {primarySourceImage && (
          <Image src={primarySourceImage} style={styles.image} />
        )}

        {data.student_workbook.reading_passage_blocks && data.student_workbook.reading_passage_blocks.length > 0 && (
          <View>
            <Text style={styles.sectionTitle}>Reading Passage</Text>
            {data.student_workbook.reading_passage_blocks.map((block, i) => (
              <View key={i} style={styles.paragraph}>
                {renderPassageWithBoldWords(block.text, block.bold_vocab_words)}
              </View>
            ))}
          </View>
        )}

        <Text style={styles.sectionTitle}>Tasks & Activities</Text>
        {data.student_workbook.tasks.map((task, i) => (
          <View key={i} style={styles.taskContainer} wrap={false}>
            <Text style={styles.taskPrompt}>{i + 1}. (DOK {task.dok_level}) {task.prompt}</Text>
            {task.sentence_starter_scaffold && (
              <Text style={styles.taskScaffold}>Sentence Starter: {task.sentence_starter_scaffold}</Text>
            )}
            <View style={styles.lines}></View>
            <View style={styles.lines}></View>
            <View style={styles.lines}></View>
            <View style={styles.lines}></View>
            <View style={{ marginBottom: 10 }}></View>
          </View>
        ))}
      </Page>
    </Document>
  );
};
