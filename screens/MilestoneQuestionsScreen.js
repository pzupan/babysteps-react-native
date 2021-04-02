import React, { Component } from 'react';
import {
  View,
  Image,
  StyleSheet,
  FlatList,
  Dimensions,
  Platform,
  AppState,
} from 'react-native';

import { Video } from 'expo-av';
import * as FileSystem from 'expo-file-system';
import { Text, Button } from 'react-native-elements';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';

import { StackActions } from 'react-navigation';

import _ from 'lodash';

import { isIphoneX } from 'react-native-iphone-x-helper';

import { connect } from 'react-redux';

import {
  fetchMilestoneSections,
  resetMilestoneQuestions,
  fetchMilestoneQuestions,
  resetMilestoneChoices,
  fetchMilestoneChoices,
  resetMilestoneAnswers,
  fetchMilestoneAnswers,
  updateMilestoneAnswers,
  apiCreateMilestoneAnswer,
  apiUpdateMilestoneAnswers,
  resetMilestoneAttachments,
  fetchMilestoneAttachments,
  updateMilestoneAttachment,
  fetchOverViewTimeline,
  updateMilestoneCalendar,
  apiUpdateMilestoneCalendar,
  fetchMilestoneCalendar,
} from '../actions/milestone_actions';
import {
  createBabyBookEntry,
  fetchBabyBookEntries,
  apiCreateBabyBookEntry,
} from '../actions/babybook_actions';
import {
  fetchUser,
  fetchRespondent,
  fetchSubject,
} from '../actions/registration_actions';

import { RenderChoices } from '../components/milestone_question_components';

import { UploadMilestoneAttachment } from '../database/sync_milestone_attachments';

import Colors from '../constants/Colors';
import States from '../actions/states';
import CONSTANTS from '../constants';
import VideoFormats from '../constants/VideoFormats';
import ImageFormats from '../constants/ImageFormats';
import AudioFormats from '../constants/AudioFormats';

const { width, height } = Dimensions.get('window');

const itemWidth = width - 30;
const twoButtonWidth = (width / 2) - 30;

class MilestoneQuestionsScreen extends Component {
  static navigationOptions = ({ navigation }) => {
    return { title: 'Screening Event' };
  };

  // Note that this component stores the active answers and questions in the state of
  // this component during the process of responding to the task.  Both are updated
  // and the local database (and remote api) are updated when the user confirms the answers.
  // That means any image or video attachments are kept in both the state of the answers
  // and a full list of attachments.

  constructor(props) {
    super(props);

    const task = this.props.navigation.state.params.task;

    this.state = {
      appState: AppState.currentState,
      task,
      section: {},
      answersFetched: false,
      attachmentsFetched: false,
      answers: [],
      attachments: [],
      data: [],
      dataReady: false,
      errorMessage: '',
      confirmed: false,
    };

    this.props.fetchUser();
    this.props.fetchRespondent();
    this.props.fetchSubject();

    this.resetDataForTask(task);

    this.saveResponse = this.saveResponse.bind(this);
  }

  componentDidMount() {
    AppState.addEventListener('change', this.handleAppStateChange);
  }

  shouldComponentUpdate(nextProps, nextState) {
    const { user, respondent, subject } = nextProps.registration;
    const { sections, questions, choices, answers, attachments } = nextProps.milestones;
    return (
      !user.fetching &&
      !respondent.fetching &&
      !subject.fetching &&
      !sections.fetching &&
      !questions.fetching &&
      !choices.fetching &&
      !answers.fetching &&
      !attachments.fetching
    );
  }

  componentDidUpdate(prevProps, prevState) {
    const { sections, questions, answers, attachments } = this.props.milestones;
    const { task, answersFetched, attachmentsFetched } = this.state;

    const navTask = this.props.navigation.state.params.task;

    // capture notification links with incorrect task
    if (typeof(navTask) !== 'object' || navTask === null) {
      this.props.navigation.navigate('Milestones');
      return;
    }
    // need to update sections for new task for remaining functions
    if (navTask.id !== task.id) {
      this.resetDataForTask(navTask);
      return;
    }
    if (sections.fetched) {
      this.saveSectionsData();
    }
    if (questions.fetched ) {
      this.saveQuestionsData();
    }
    if (answers.fetched && !answersFetched) {
      this.saveAnswersData();
    }
    if (attachments.fetched && !attachmentsFetched) {
      this.saveAttachmentsData();
    }
  }

  componentWillUnmount() {
    AppState.removeEventListener('change', this.handleAppStateChange);
  }

  handleAppStateChange = nextAppState => {
    const { appState, task } = this.state;
    if (appState.match(/inactive|background/) && nextAppState === 'active') {
      this.resetDataForTask(task);
    }
    this.setState({ appState: nextAppState });
  };

  resetDataForTask = task => {
    this.setState({
      task,
      section: { id: null },
      answersFetched: false,
      attachmentsFetched: false,
      answers: [],
      attachments: [],
      data: [],
      dataReady: false,
      confirmed: false,
    });
    this.props.resetMilestoneQuestions();
    this.props.resetMilestoneChoices();
    this.props.resetMilestoneAnswers();
    this.props.resetMilestoneAttachments();
    this.props.fetchMilestoneSections({ task_id: task.id });
  };

  saveSectionsData = () => {
    const sections = this.props.milestones.sections.data;
    if (!_.isEmpty(sections)) {
      // default to first section
      // TODO extend UI to allow for multiple sections
      const section = sections[0];
      if (section.id !== this.state.section.id) {
        this.setState({ section });
        this.props.fetchMilestoneQuestions({ section_id: section.id });
        this.props.fetchMilestoneAnswers({  section_id: section.id });
        this.props.fetchMilestoneAttachments({ section_id: section.id });
      }
    }
  };

  saveQuestionsData = () => {
    const { questions, choices } = this.props.milestones;
    const { firstQuestion, dataReady } = this.state;
    if (!_.isEmpty(questions.data)) {

      if (_.isEmpty(firstQuestion)) {
        this.setState({ firstQuestion: questions.data[0] });
      }
      if (!choices.fetched) {
        // question IDs for repeat questions
        const questionIDs = _.map(questions.data.slice(1), 'id');
        this.setState({ questionIDs });
        const question_ids = _.map(questions.data, 'id');
        this.props.fetchMilestoneChoices({ question_ids });
      }
      if (choices.fetched && !dataReady) {
        const data = _.map(questions.data, question => {
          return _.extend({}, question, {
            choices: _.filter(choices.data, ['question_id', question.id]),
          });
        });
        this.setState({ data, dataReady: true });
      }
    }
  };

  saveAnswersData = () => {
    let answers = this.props.milestones.answers.data;
    answers = _.orderBy(answers, ['choice_id', 'id'], ['asc', 'desc']);
    if (!_.isEmpty(answers)) {
      this.setState({
        answers,
        answersFetched: true,
      });
    }
  };

  saveAttachmentsData = () => {
    let attachments = this.props.milestones.attachments.data;
    attachments = _.orderBy(attachments, ['choice_id', 'id'], ['asc', 'desc']);
    if (!_.isEmpty(attachments)) {
      this.setState({
        attachments,
        attachmentsFetched: true,
      });
    }
  };

  renderItem = item => {
    const question = item.item;
    const question_number = _.isEmpty(question.question_number)
      ? String(question.position)
      : question.question_number;
    const title = `${question_number}. ${question.title}`;
    const { answers, attachments, errorMessage } = this.state;
    return (
      <View key={question.id} style={styles.questionContainer}>
        {question.attachment_url &&
          this.renderAttachment(question.attachment_url)}
        <View style={styles.questionLeft}>
          <Text style={styles.question}>{title}</Text>
          {!!question.body && (
            <Text style={styles.questionBody}>{question.body}</Text>
          )}
        </View>
        <RenderChoices
          question={question}
          answers={answers}
          attachments={attachments}
          navigation={this.props.navigation}
          saveResponse={this.saveResponse}
          errorMessage={errorMessage}
        />
      </View>
    );
  };

  saveResponse = async (choice, response, options = {}) => {
    const { user, respondent, subject } = this.props.registration;
    const { task, section } = this.state;
    const attachments = response.attachments;

    delete response.attachments;

    // all answers for this section
    const answers = [...this.state.answers];
    const newAnswers = [];

    const format = options.format;

    if (format === 'single') {
      // reset all answers to false for this question
      _.map(answers, answer => {
        if (
          answer.question_id === choice.question_id &&
          answer.choice_id !== choice.id
        ) {
          answer.answer_boolean = false;
          // include answers in update
          newAnswers.push(answer);
        }
      });
    }

    // check for response in this session
    let answer = _.find(answers, {choice_id: choice.id});

    // update object with data
    answer = {
      ...answer,
      answer_boolean: null,
      answer_datetime: null,
      answer_numeric: null,
      answer_text: null,
      user_id: user.data.id,
      user_api_id: user.data.api_id,
      respondent_id: respondent.data.id,
      respondent_api_id: respondent.data.api_id,
      subject_id: subject.data.id,
      subject_api_id: subject.data.api_id,
      milestone_id: task.milestone_id,
      task_id: task.id,
      section_id: section.id,
      question_id: choice.question_id,
      choice_id: choice.id,
      score: choice.score,
      pregnancy: 0,
      ...response,
    };

    if (attachments) {
      answer.answer_boolean = true;
      // answer.attachments = await
      this.mapAttachmentsAsync(answer, choice, attachments);
    } // response.attachments

    newAnswers.push(answer);

    // update answers
    _.map(newAnswers, newAnswer => {
      const index = _.findIndex(answers, {choice_id: newAnswer.choice_id});
      if (index === -1) {
        // not in answers yet
        answers.push(newAnswer);
      } else {
        // replace in answers
        answers.splice(index, 1, newAnswer);
      }
    });

    this.updateAnswersState(answers);
  };

  updateAnswersState = answers => {
    this.setState({ answers });
  };

  mapAttachmentsAsync = async (answer, choice, newAttachments) => {
    const { user, subject } = this.props.registration;
    const { section } = this.state;
    let attachments = [...this.state.attachments];
    // sort with highest id first
    attachments = _.reverse(_.sortBy(attachments, 'id'));
    // then find first match (with highest id)
    const oldAttachment = _.find(attachments, {choice_id: choice.id});
    // remove from collection
    attachments = _.reject(attachments, att => {
      if (_.isEmpty(att)) return true;
      if (att.choice_id === choice.id) return true;
    });

    await _.map(newAttachments, async attachment => {
      let newAttachment = {
        ...oldAttachment,
        user_api_id: user.data.api_id,
        subject_api_id: subject.data.api_id,
        section_id: section.id,
        choice_id: choice.id,
        title: attachment.title,
        width: attachment.width,
        height: attachment.height,
      };
      if (answer.id) {
        newAttachment.answer_id = answer.id;
      }

      newAttachment.filename = attachment.uri.substring(
        attachment.uri.lastIndexOf('/') + 1,
        attachment.uri.length,
      );

      const attachmentDir = FileSystem.documentDirectory + CONSTANTS.ATTACHMENTS_DIRECTORY;
      newAttachment.uri = attachmentDir + '/' + newAttachment.filename;

      const fileType = attachment.uri.substring(
        attachment.uri.lastIndexOf('.') + 1,
        attachment.uri.length,
      );

      switch (attachment.file_type) {
        case 'file_image':
          newAttachment.content_type = ImageFormats[fileType];
          break;
        case 'file_video':
          newAttachment.content_type = VideoFormats[fileType];
          break;
        case 'file_audio':
          newAttachment.content_type = AudioFormats[fileType];
          break;
        default:
          newAttachment.content_type = '';
      }

      // confirm physical file
      let resultFile = await FileSystem.getInfoAsync(attachment.uri);

      if (!resultFile.exists) {
        console.log(`Error: file doesn't exist, attachment not saved: Choice ID: ${choice.id};  File Name: ${attachment.filename}`);
        this.setState({errorMessage: 'Error: Attachment Not Saved'});
        return;
      }

      // move file from camera cache to app cache
      await FileSystem.copyAsync({ from: attachment.uri, to: newAttachment.uri });

      // confirm file
      resultFile = await FileSystem.getInfoAsync(newAttachment.uri, {
        size: true,
        md5: true,
      });

      if (!resultFile.exists) {
        console.log(`Error: attachment not copied: ${newAttachment.filename}`);
        this.setState({errorMessage: 'Error: Attachment Not Saved'});
        return;
      }

      _.assign(newAttachment, {
        size: resultFile.size,
        checksum: resultFile.md5,
      });

      attachments.push(newAttachment);

      this.updateAttachmentState(attachments);
    }); // map attachments
  };

  updateAttachmentState = attachments => {
    this.setState({ attachments });
  };

  handleConfirm = () => {
    const { section, answers, attachments } = this.state;
    const session = this.props.session;
    const questions = this.props.milestones.questions.data;
    const choices = this.props.milestones.choices.data;
    const calendars = this.props.milestones.calendar.data;
    const inStudy = session.registration_state === States.REGISTERED_AS_IN_STUDY;

    // TODO validation
    // TODO move to next section if more than one section in this task
    // TOTO don't mark task complete if any sections are incomplete
    this.setState({ confirmed: true });

    this.props.updateMilestoneAnswers(section, answers);
    const completed_at = new Date().toISOString();
    this.props.updateMilestoneCalendar(section.task_id, { completed_at });

    if (inStudy) {
      this.props.apiUpdateMilestoneAnswers(session, section.id, answers);

      // mark calendar entry as complete on api
      const calendar = _.find(calendars, ['task_id', section.task_id]);
      if (calendar && calendar.id) {
        this.props.apiUpdateMilestoneCalendar(calendar.id, {milestone_trigger: { completed_at }});
      }
    }

    // save attachments
    if (!_.isEmpty(attachments)) {
      _.map(attachments, attachment => {
        const choice = _.find(choices, ['id', attachment.choice_id]);

        // cover of babybook will only be baby's face from overview timeline
        let cover = 0;
        if (choice && choice.overview_timeline === 'post_birth') {
          cover = true;
        }

        this.props.updateMilestoneAttachment(attachment);

        if (inStudy) {
          UploadMilestoneAttachment(attachment);
        }
        if (
          attachment.content_type &&
          (attachment.content_type.includes('video') ||
            attachment.content_type.includes('image'))
        ) {
          const data = { title: null, detail: null, cover };
          this.props.createBabyBookEntry(data, attachment);
          //this.props.apiCreateBabyBookEntry(session, data, attachment);
        }
      });
    }

    let message = '';

    const unansweredQuestions = _.filter(questions, question => {
      return _.find(answers, { question_id: question.id }) === undefined;
    });
    this.props.updateMilestoneCalendar(section.task_id, {
      questions_remaining: unansweredQuestions.length,
    });

    if (unansweredQuestions.length > 0) {
      message = 'Please note that not all questions were completed.';
    }
    // add condolences message to confirmation screen
    if (section.task_id === CONSTANTS.TASK_BIRTH_QUESTIONAIRE_ID) {
      const answer = _.find(answers, ['choice_id', CONSTANTS.CHOICE_BABY_ALIVE_ID]);
      if (answer && answer.answer_boolean) {
        message =
          "We're so sorry to hear of your loss. We appreciate the contribution you have made to BabySteps.";
      }
    }

    this.props.resetMilestoneAnswers();
    this.props.fetchMilestoneCalendar();
    this.props.fetchBabyBookEntries();
    this.props.fetchOverViewTimeline();

    this.props.navigation.navigate('MilestoneQuestionConfirm', { message });
  };

  renderImageAttachement = uri => {
    return (
      <Image
        style={styles.image}
        source={{ uri }}
        resizeMethod="scale"
        resizeMode="contain"
      />
    );
  };

  renderVideoAttachment = uri => {
    return (
      <Video
        source={{ uri }}
        resizeMode={Video.RESIZE_MODE_COVER}
        shouldPlay={false}
        isLooping={false}
        useNativeControls
        ref={ref => (this.videoPlayer = ref)}
        style={styles.video}
      />
    );
  };

  renderAttachment = attachment_url => {
    const fileExtension = attachment_url.split('.').pop();
    if (_.has(VideoFormats, fileExtension)) {
      return this.renderVideoAttachment(attachment_url);
    }
    return this.renderImageAttachement(attachment_url);
  };

  render() {
    const navigation = this.props.navigation;
    const {
      dataReady,
      confirmed,
      section,
      task_name,
      data,
    } = this.state;
    return (
      <View style={{ height }}>
        <KeyboardAwareScrollView
          contentContainerStyle={styles.container}
          enableResetScrollToCoords={false}
          enableAutomaticScroll
          enableOnAndroid
          extraScrollHeight={50}
          innerRef={ref => {this.scroll = ref}}
        >
          <View style={styles.listContainer}>
            <Text style={styles.taskHeader}>{task_name}</Text>
            {!!section && !!section.body && (
              <View style={styles.instructions}>
                <Text style={styles.instructionsLabel}>
                  Instructions: &nbsp;
                </Text>
                <Text>{section.body}</Text>
              </View>
            )}
            <FlatList
              renderItem={this.renderItem}
              data={data}
              keyExtractor={item => String(item.id)}
              extraData={this.state}
            />
          </View>
        </KeyboardAwareScrollView>

        {dataReady && (
          <View
            style={[
              styles.buttonContainer,
              Platform.OS === 'android'
                ? styles.buttonContainerAndroid
                : styles.buttonContainerIOS,
            ]}
          >
            <Button
              color={Colors.grey}
              buttonStyle={styles.buttonOneStyle}
              titleStyle={styles.buttonTitleStyle}
              onPress={() => {
                navigation.dispatch(StackActions.popToTop());
              }}
              title="Cancel"
            />
            <Button
              color={Colors.pink}
              buttonStyle={styles.buttonTwoStyle}
              titleStyle={styles.buttonTitleStyle}
              onPress={this.handleConfirm}
              title="Mark Completed"
              disabled={confirmed}
            />
          </View>
        )}
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    paddingBottom: 300,
  },
  listContainer: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  taskHeader: {
    fontSize: 18,
    paddingHorizontal: 10,
    paddingVertical: 20,
    color: Colors.white,
    width,
    backgroundColor: Colors.mediumGrey,
    textAlign: 'center',
  },
  instructions: {
    flex: 1,
    fontSize: 14,
    margin: 10,
  },
  instructionsLabel: {
    fontWeight: 'bold',
  },
  questionContainer: {
    flexDirection: 'column',
    padding: 5,
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: Colors.lightGrey,
  },
  questionLeft: {
    flexDirection: 'column',
    justifyContent: 'flex-start',
    width: itemWidth,
  },
  question: {
    fontSize: 14,
    paddingVertical: 2,
    paddingLeft: 5,
    color: Colors.tint,
    width: itemWidth,
  },
  questionBody: {
    fontSize: 12,
    paddingVertical: 2,
    paddingLeft: 20,
    color: Colors.tint,
  },
  image: {
    flex: 1,
    width: itemWidth,
    height: itemWidth * 0.66,
    alignSelf: 'center',
    borderWidth: 1,
    borderColor: Colors.lightGrey,
    borderRadius: 10,
    marginBottom: 10,
  },
  video: {
    flex: 1,
    width: itemWidth,
    height: itemWidth * 0.66,
    alignSelf: 'center',
    borderWidth: 1,
    borderColor: Colors.lightGrey,
    borderRadius: 10,
    marginBottom: 10,
  },
  buttonContainer: {
    flex: 1,
    justifyContent: 'center',
    flexDirection: 'row',
    width: '100%',
    paddingTop: 10,
    paddingBottom: 10,
    borderTopWidth: 1,
    borderTopColor: Colors.lightGrey,
    backgroundColor: Colors.background,
    position: 'absolute',
  },
  buttonContainerAndroid: {
    bottom: 150,
  },
  buttonContainerIOS: {
    bottom: isIphoneX() ? 172 : 110,
  },
  buttonTitleStyle: {
    fontWeight: '900',
  },
  buttonOneStyle: {
    flex: 1,
    width: twoButtonWidth,
    backgroundColor: Colors.lightGrey,
    borderColor: Colors.grey,
    borderWidth: 2,
    borderRadius: 5,
  },
  buttonTwoStyle: {
    flex: 1,
    width: twoButtonWidth,
    backgroundColor: Colors.lightPink,
    borderColor: Colors.pink,
    borderWidth: 2,
    borderRadius: 5,
  },
});

const mapStateToProps = ({ session, milestones, registration }) => ({
  session,
  milestones,
  registration,
});
const mapDispatchToProps = {
  fetchUser,
  fetchRespondent,
  fetchSubject,
  fetchMilestoneSections,
  resetMilestoneQuestions,
  fetchMilestoneQuestions,
  resetMilestoneChoices,
  fetchMilestoneChoices,
  resetMilestoneAnswers,
  fetchMilestoneAnswers,
  updateMilestoneAnswers,
  apiCreateMilestoneAnswer,
  apiUpdateMilestoneAnswers,
  resetMilestoneAttachments,
  fetchMilestoneAttachments,
  updateMilestoneAttachment,
  createBabyBookEntry,
  fetchBabyBookEntries,
  fetchOverViewTimeline,
  updateMilestoneCalendar,
  apiUpdateMilestoneCalendar,
  fetchMilestoneCalendar,
  apiCreateBabyBookEntry,
};

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(MilestoneQuestionsScreen);
