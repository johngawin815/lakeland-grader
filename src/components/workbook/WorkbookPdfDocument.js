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

const renderMarkdownPassage = (text) => {
  if (!text) return null;
  // Splits by **bold** tags and captures them
  const parts = text.split(/(\*\*.*?\*\*)/g);
  return (
    <Text>
      {parts.map((part, index) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          // Slice off the ** from the start and end
          return <Text key={index} style={styles.bold}>{part.slice(2, -2)}</Text>;
        }
        return <Text key={index} style={styles.normal}>{part}</Text>;
      })}
    </Text>
  );
};

export const WorkbookPdfDocument = ({ data, primarySourceImage, meta }) => {
  if (!data) return null;

  const tierLevel = data.document_metadata?.tier_level || 'General';
  const topic = data.document_metadata?.topic || meta?.unitTopic || 'Topic Overview';

  return (
    <Document>
      {/* TEACHER KEY PAGE */}
      <Page style={styles.page}>
        <Text style={styles.header}>Teacher Key - {tierLevel}</Text>
        <Text style={{ fontFamily: 'Helvetica-Bold', fontSize: 14 }}>{topic}</Text>
        
        <Text style={styles.sectionTitle}>Expected Answers</Text>
        <View style={styles.list}>
          {data.teacher_key && data.teacher_key.map((ans, i) => (
            <Text key={i} style={styles.listItem}>• {ans.question_id}: (DOK {ans.dok_level}) {ans.answer}</Text>
          ))}
        </View>
      </Page>

      {/* STUDENT WORKBOOK PAGE(S) */}
      <Page style={styles.page}>
        <Text style={styles.header}>Student Workbook - {tierLevel}</Text>
        <Text style={{ fontFamily: 'Helvetica-Bold', fontSize: 14 }}>{topic}</Text>
        
        {primarySourceImage && (
          <Image src={primarySourceImage} style={styles.image} />
        )}

        {data.student_workbook?.reading_passage && (
          <View>
            <Text style={styles.sectionTitle}>Reading Passage</Text>
            <View style={styles.paragraph}>
              {renderMarkdownPassage(data.student_workbook.reading_passage)}
            </View>
          </View>
        )}

        {data.student_workbook?.activities && data.student_workbook.activities.map((activity, actIdx) => (
          <View key={actIdx} wrap={false}>
            <Text style={styles.sectionTitle}>{activity.activity_title}</Text>
            
            {activity.required_image_description && (
              <Text style={{ fontStyle: 'italic', marginBottom: 10 }}>[Image Description: {activity.required_image_description}]</Text>
            )}

            {activity.questions && activity.questions.map((q, qIdx) => (
              <View key={qIdx} style={styles.taskContainer} wrap={false}>
                <Text style={styles.taskPrompt}>{q.question_id}. {q.prompt}</Text>
                {q.sentence_starter ? (
                  <Text style={styles.taskScaffold}>{q.sentence_starter} _______________</Text>
                ) : (
                  <>
                    <View style={styles.lines}></View>
                    <View style={styles.lines}></View>
                    <View style={styles.lines}></View>
                  </>
                )}
                <View style={{ marginBottom: 10 }}></View>
              </View>
            ))}
          </View>
        ))}
      </Page>
    </Document>
  );
};
