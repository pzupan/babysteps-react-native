import React from 'react';
import {
  Image,
  Text,
  View,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { Notifications } from 'expo';

import SideSwipe from 'react-native-sideswipe';
import { Ionicons } from '@expo/vector-icons';

import find from 'lodash/find';
import isEmpty from 'lodash/isEmpty';
import filter from 'lodash/filter';
import sortBy from 'lodash/sortBy';

import { connect } from 'react-redux';

import {
  fetchMilestones,
  resetApiMilestones,
  apiFetchMilestones,
  fetchMilestoneGroups,
  fetchMilestoneTasks,
  resetApiMilestoneCalendar,
  fetchMilestoneCalendar,
  apiCreateMilestoneCalendar,
} from '../actions/milestone_actions';

import { fetchSubject } from '../actions/registration_actions';

import Colors from '../constants/Colors';
import States from '../actions/states';
import CONSTANTS from '../constants';
import milestoneGroupImages from '../constants/MilestoneGroupImages';

const { width, height } = Dimensions.get('window');

const wp = (percentage, direction) => {
  const value = (percentage * direction) / 100;
  return Math.round(value);
};

const scContainerHeight = wp(30, height);
const scCardHeight = wp(70, scContainerHeight);
const scCardWidth = wp(80, width);
const scCardMargin = (width - scCardWidth) / 2;

const mgContainerHeight = wp(30, height);
const mgImageHeight = wp(80, mgContainerHeight);
const mgImageWidth = wp(80, width);
const mgImageMargin = (width - mgImageWidth) / 2;

class OverviewScreen extends React.Component {
  static navigationOptions = {
    header: null,
  };

  state = {
    currentIndexScreening: 0,
    currentIndexMilestones: 0,
    apiFetchCalendarSubmitted: false,
    testNotificationCreated: false,
    scSliderLoading: true,
    mgSliderLoading: true,
    milestoneGroups: [],
    screeningEvents: [],
  };

  componentWillMount() {
    this.props.resetApiMilestones();
    this.props.resetApiMilestoneCalendar();
    this.props.fetchMilestoneGroups();
    this.props.fetchMilestoneCalendar();
    this.props.fetchSubject();
  }

  componentWillReceiveProps(nextProps) {
    const groups = nextProps.milestones.groups;
    if (!groups.fetching && groups.fetched) {
      if (isEmpty(groups.data)) {
        const api_milestones = nextProps.milestones.api_milestones;
        if (!api_milestones.fetching && !api_milestones.fetched) {
          this.props.apiFetchMilestones();
        }
      } else {
        const milestoneGroups = filter(groups.data, {visible: 1});
        milestoneGroups = sortBy(milestoneGroups, ['position']);
        milestoneGroups.forEach((group, index) => {
          group.uri = milestoneGroupImages[index];
        });
        this.setState({
          milestoneGroups: milestoneGroups,
          mgSliderLoading: false,
        });
      } // isEmpty groups
    }

    const subject = nextProps.registration.subject;
    const calendar = nextProps.milestones.calendar;
    if (!subject.fetching && subject.fetched) {
      if (!calendar.fetching && calendar.fetched) {
        if (isEmpty(calendar.data)) {
          const api_calendar = nextProps.milestones.api_calendar;
          if (
            !api_calendar.fetching &&
            subject.data !== undefined &&
            !this.state.apiFetchCalendarSubmitted
          ) {
            if (nextProps.session.registration_state === States.REGISTERED_AS_IN_STUDY) {
              this.props.apiCreateMilestoneCalendar({
                subject_id: subject.data.api_id,
              });
            } else {
              this.props.apiCreateMilestoneCalendar({
                base_date: subject.data.expected_date_of_birth,
              });
            }
            this.setState({ apiFetchCalendarSubmitted: true });
          }
        } else {
          const timeNow = new Date();
          const screeningEvents = filter(calendar.data, function(s) {
            return (new Date(s.notify_at) > timeNow) && !s.momentary_assessment;
          });
          screeningEvents = sortBy(screeningEvents, function(s) {
            return (new Date(s.notify_at));
          });
          this.setState({
            screeningEvents: screeningEvents,
            scSliderLoading: false,
          });
        } // isEmpty calendar data
      } // calendar fetcbhing
    } // subject fetching
  }

  testNotification(noticeType = null) {
    const tasks = this.props.milestones.tasks;
    if (!tasks.fetching && isEmpty(tasks.data)) {
      this.props.fetchMilestoneTasks();
      return;
    }
    let task = {};
    let filteredTasks = [];
    let index = 0;
    if (noticeType.momentary_assessment) {
      filteredTasks = filter(tasks.data, {momentary_assessment: 1});
      index = Math.floor(Math.random() * 4);
    } else {
      filteredTasks = filter(tasks.data, {momentary_assessment: 0});
      index = Math.floor(Math.random() * 75);
    }
    task = filteredTasks[index];
    if (task) {
      Notifications.presentLocalNotificationAsync({
        title: task.milestone_title,
        body: task.name,
        data: {
          task_id: task.id,
          title: task.milestone_title,
          body: task.name,
          momentary_assessment: task.momentary_assessment,
          response_scale: task.response_scale,
          type: 'info',
        },
      });
      this.setState({testNotificationCreated: true});
    } // task
  };

  renderScreeningItem = item => {
    const task = item.item;
    const longDate = new Date(task.notify_at).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    return (
      <View style={styles.screening_slide_container}>
        <Text numberOfLines={1} style={styles.screening_title}>{ task.title }</Text>
        <Text numberOfLines={1} style={styles.screening_date}> { longDate }</Text>
        <Text numberOfLines={3} style={styles.screening_text}>{ task.message }</Text>
        <View style={styles.screening_slide_link}>
          <TouchableOpacity key={item.currentIndex} style={styles.screening_button}>
            <Text style={styles.screening_button_text}>Get Started</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  renderMilestoneItem = item => {
    const milestone = item.item;
    return (
      <TouchableOpacity
        style={styles.mg_touchable}
        key={item._pageIndex}
        onPress={() => this.props.navigation.navigate('Milestones')}
      >
        <View style={styles.slide_item}>
          <Image source={milestone.uri} style={styles.slide_item_image} />
          <View style={styles.slide_item_footer}>
            <Text style={styles.slide_item_footer_text}>{milestone.title}</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  render() {
    return (
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        <ScrollView
          style={styles.container}
          contentContainerStyle={styles.contentContainer}
        >
          <View style={styles.welcomeContainer}>
            <Image
              source={
                __DEV__
                  ? require('../assets/images/robot-dev.png')
                  : require('../assets/images/robot-prod.png')
              }
              style={styles.welcomeImage}
            />
            <TouchableOpacity 
              style={[styles.opacityStyle, {marginTop: 30}]}
              onPress={() => this.testNotification({momentary_assessment: false})}
            >
              <Text>Fire regular notification</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.opacityStyle, {marginTop: 20}]}
              onPress={() => this.testNotification({momentary_assessment: true})}
            >
              <Text>Fire momentary assessment notification</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>

        <View style={styles.slider_container}>
          <View style={styles.slider_header}>
            <View style={styles.slider_title}>
              <Text style={styles.slider_title_text}>Screening Events</Text>
            </View>
            <TouchableOpacity style={styles.opacityStyle}>
              <Text style={styles.slider_link_text}>View all</Text>
              <Ionicons name='md-arrow-forward' style={styles.slider_link_icon} />
            </TouchableOpacity>
          </View>
          <View style={styles.slider}>
            {this.state.scSliderLoading && (
              <ActivityIndicator size="large" color={Colors.tint} />
            )}
            <SideSwipe
              index={this.state.currentIndexScreening}
              data={this.state.screeningEvents}
              renderItem={item => this.renderScreeningItem(item)}
              itemWidth={scCardWidth + scCardMargin}
              contentOffset={scCardMargin - 2}
              onIndexChange={index =>
                this.setState(() => ({ currentIndexScreening: index }))
              }
            />
          </View>
        </View>

        <View style={styles.slider_container}>
          <View style={styles.slider_header}>
            <View style={styles.slider_title}>
              <Text style={styles.slider_title_text}>Developmental Milestones</Text>
            </View>
            <TouchableOpacity
              style={styles.opacityStyle} 
              onPress={()=>{this.props.navigation.navigate('Milestones')}} >
              <Text style={styles.slider_link_text}>View all</Text>
              <Ionicons name='md-arrow-forward' style={styles.slider_link_icon} />
            </TouchableOpacity>
          </View>
          <View style={styles.slider}>
            {this.state.mgSliderLoading &&
              <ActivityIndicator size="large" color={Colors.tint} />
            }
            <SideSwipe
              index={this.state.currentIndexMilestones}
              data={this.state.milestoneGroups}
              renderItem={item => this.renderMilestoneItem(item)}
              itemWidth={mgImageWidth + mgImageMargin}
              threshold={mgImageWidth}
              contentOffset={mgImageMargin - 2}
              onIndexChange={index =>
                this.setState({ currentIndexMilestones: index })
              }
            />
          </View>
        </View>
      </ScrollView>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  contentContainer: {
    paddingTop: 30,
  },
  opacityStyle: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  welcomeContainer: {
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 20,
  },
  welcomeImage: {
    width: 100,
    height: 80,
    resizeMode: 'contain',
    marginTop: 3,
    marginLeft: -10,
  },
  slider_container: {
    height: mgContainerHeight,
    borderTopWidth: 2,
    borderTopColor: Colors.lightGrey,
  },
  slide_item: {
    flex: 1,
    width: mgImageWidth,
    height: mgImageHeight,
    borderRadius: 5,
    marginRight: mgImageMargin,
  },
  slide_item_image: {
    flex: 1,
    width: mgImageWidth,
    height: mgImageHeight,
  },
  slide_item_footer: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    justifyContent: 'flex-end',
    alignItems: 'flex-end',
  },
  slide_item_footer_text: {
    color: Colors.white,
    width: '100%',
    backgroundColor: Colors.lightGrey,
    paddingVertical: 10,
    paddingLeft: 10,
  },
  slider_header: {
    width: '90%',
    alignSelf: 'center',
    flexDirection: 'row',
    paddingVertical: 10,
  },
  slider_title: {
    flex: 2,
  },
  slider_title_text: {
    fontSize: 15,
  },
  slider_link_text: {
    marginRight: 5,
    fontSize: 15,
    color: Colors.darkGreen,
  },
  slider_link_icon: {
    fontSize: 15,
    color: Colors.darkGreen,
  },
  slider: {
    flex: 1,
    paddingLeft: 5,
    marginBottom: 10,
  },
  mg_touchable: {
    height: mgImageHeight,
  },
  screening_slide_container: {
    width: scCardWidth,
    height: scCardHeight,
    marginRight: scCardMargin,
    borderRadius: 5,
    borderColor: Colors.lightGrey,
    borderWidth: 1,
    padding: 10,
  },
  screening_slide_link: {
    marginTop: 10,
    justifyContent: 'flex-end',
    alignItems: 'flex-start',
  },
  screening_title: {
    fontSize: 14,
    color: Colors.darkGrey,
    fontWeight: '900',
  },
  screening_date: {
    fontSize: 10,
    color: Colors.darkGrey,
  },
  screening_text: {
    fontSize: 12,
    color: Colors.darkGrey,
  },
  screening_button: {
    padding: 3,
    borderWidth: 1,
    borderColor: Colors.pink,
    backgroundColor: Colors.lightPink,
    borderRadius: 5,
  },
  screening_button_text: {
    fontSize: 12,
    color: Colors.darkPink,
  },
});

const mapStateToProps = ({ session, milestones, registration }) => ({
  session,
  milestones,
  registration,
});
const mapDispatchToProps = {
  fetchMilestones,
  resetApiMilestones,
  apiFetchMilestones,
  fetchMilestoneGroups,
  fetchMilestoneTasks,
  fetchMilestoneCalendar,
  resetApiMilestoneCalendar,
  apiCreateMilestoneCalendar,
  fetchSubject,
};
export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(OverviewScreen);
