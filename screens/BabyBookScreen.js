import React, { Component } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Share,
  TouchableOpacity,
  Dimensions,
  Platform,
} from 'react-native';
import SideSwipe from 'react-native-sideswipe';
import PageControl from 'react-native-page-control';
import { Ionicons } from '@expo/vector-icons';

import isEmpty from 'lodash/isEmpty';
import indexOf from 'lodash/indexOf';
import map from 'lodash/map';
import forEach from 'lodash/forEach';
import sortBy from 'lodash/sortBy';

import { connect } from 'react-redux';

import {
  resetBabyBookEntries,
  fetchBabyBookEntries,
} from '../actions/babybook_actions';
import { fetchSubject } from '../actions/registration_actions';

import BabyBookCoverItem from '../components/babybook_cover_item';
import BabyBookItem from '../components/babybook_item';
import BabyBookGetImage from '../components/babybook_get_image';

import Colors from '../constants/Colors';
import CONSTANTS from '../constants';

const { width, height } = Dimensions.get('window');
const heightOffset = 180; // compensate for header and navbar
const contentOffset = (width - BabyBookItem.WIDTH) / 2;
const widthOffset = 40;
const imageWidth = BabyBookGetImage.IMAGE_WIDTH;

const babybookDir = `${Expo.FileSystem.documentDirectory +
  CONSTANTS.BABYBOOK_DIRECTORY}/`;

class BabyBookScreen extends Component {
  static navigationOptions = ({ navigation }) => ({
    headerTitle: (
      <View style={styles.headerContainer}>
        <Text style={styles.headerTitle}>BabyBook</Text>

        <View style={styles.headerButtonContainer}>
          {navigation.state.params &&
            navigation.state.params.babybookEntries && (
              <TouchableOpacity
                style={styles.headerButton}
                onPress={() => navigation.state.params.Share()}
              >
                <Ionicons
                  name={Platform.OS === 'ios' ? 'ios-share' : 'md-share'}
                  size={26}
                  color={Colors.white}
                />
              </TouchableOpacity>
            )}

          {false && (
            <TouchableOpacity
              style={styles.headerButton}
              onPress={() => () => navigation.navigate('BabyBookTimeline')}
            >
              <Ionicons name="timeline" size={26} color={Colors.white} />
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => navigation.navigate('BabyBookEntry')}
          >
            <Ionicons
              name={Platform.OS === 'ios' ? 'ios-camera' : 'md-camera'}
              size={26}
              color={Colors.white}
            />
          </TouchableOpacity>
        </View>
      </View>
    ),
  });

  state = {
    currentIndex: 0,
    data: [
      {
        id: '0',
        file_name: null,
        file_uri: require('../assets/images/baby_book_timeline_incomplete_baby_profile_placeholder.png'),
        type: 'cover',
        imageHeight: imageWidth,
      },
    ],
    shareAttributes: {
      content: {
        title: '',
        message: 'none',
        url: '', // ios only
      },
      options: {
        subject: 'Nothing to Share', // for email
        dialogTitle: 'Nothing to Share ', // Android only
      },
    },
  };

  componentWillMount() {
    if (isEmpty(this.props.registration.subject.data)) {
      this.props.fetchSubject();
    }

    this.props.fetchBabyBookEntries();

    // bind function to navigation
    this.props.navigation.setParams({
      babybookEntries: false,
      Share: this.shareOpen.bind(this),
    });

    // set selected item from timeline
    const itemId = this.props.navigation.getParam('itemId', '0');
    if (itemId !== '0') {
      const selectedIndex = indexOf(
        map(this.state.data, 'id'),
        String(parseInt(itemId, 10) + 1), // increment by 1 to account for cover
      );

      this.setState({ currentIndex: selectedIndex });
    }
  }

  componentDidMount() {
    if (!isEmpty(this.props.babybook.entries.data)) {
      this.props.navigation.setParams({ babybookEntries: true });
    }
  }

  componentWillReceiveProps(nextProps) {
    if (
      !nextProps.babybook.entries.fetching &&
      nextProps.babybook.entries.fetched
    ) {
      if (!isEmpty(nextProps.babybook.entries.data)) {
        let data = [];
        forEach(nextProps.babybook.entries.data, item => {
          if (item.file_name) {
            const uri = babybookDir + item.file_name;
            const uriParts = item.file_name.split('.');
            data.push({ ...item, file_uri: { uri } });
          }
        });
        data = sortBy(data, i => i.created_at).reverse();
        // add entry for cover
        data = [{ ...data[0], id: '0' }].concat(data);
        this.setState({ data });
        // update share
        this.setShareAttributes(this.state.currentIndex);
      }
    }
  }

  shouldComponentUpdate(nextProps, nextState) {
    return (
      !nextProps.registration.subject.fetching &&
      !nextProps.babybook.entries.fetching
    );
  }

  shareOpen() {
    if (this.state.shareAttributes.content) {
      Share.share(
        this.state.shareAttributes.content,
        this.state.shareAttributes.options,
      );
    }
  }

  handleIndexChange(index) {
    this.setState({ currentIndex: index });
    this.setShareAttributes(index);
  }

  setShareAttributes(index) {
    // for share
    const item = this.state.data[index];
    const uri = babybookDir + item.file_name;

    this.setState({
      shareAttributes: {
        content: {
          title: item.title,
          message: item.detail,
          url: uri, // ios only
        },
        options: {
          subject: item.title, // for email
          dialogTitle: `Share ${item.title}`, // Android only
        },
      },
    });
  }

  renderItem({ item, itemIndex }) {
    if (itemIndex === 0) {
      return (
        <BabyBookCoverItem item={item} navigation={this.props.navigation} />
      );
    }
    return <BabyBookItem item={item} navigation={this.props.navigation} />;
  }

  render() {
    return (
      <View style={styles.container}>
        <PageControl
          style={styles.pageControl}
          numberOfPages={this.state.data.length}
          currentPage={this.state.currentIndex}
          hidesForSinglePage
          pageIndicatorTintColor={Colors.lightGrey}
          currentPageIndicatorTintColor={Colors.headerBackgroundColor}
          indicatorStyle={{ borderRadius: 0 }}
          currentIndicatorStyle={{ borderRadius: 0 }}
          indicatorSize={{ width: 10, height: 10 }}
          onPageIndicatorPress={index => this.handleIndexChange(index)}
        />
        <View style={styles.viewContainer}>
          <SideSwipe
            data={this.state.data}
            index={this.state.currentIndex}
            shouldCapture={() => true}
            style={[styles.carouselFill, { width }]}
            itemWidth={BabyBookItem.WIDTH}
            threshold={BabyBookItem.WIDTH / 2}
            contentOffset={contentOffset}
            extractKey={item => item.id}
            onIndexChange={index => this.handleIndexChange(index)}
            renderItem={page => this.renderItem(page)}
          />
        </View>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  viewContainer: {
    flex: 1,
    flexGrow: 1,
    marginTop: 10,
    justifyContent: 'space-between',
    alignItems: 'center',
    minHeight: height - heightOffset,
    backgroundColor: Colors.background,
  },
  carouselFill: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  pageControl: {
    height: 20,
    marginTop: 12,
  },
  headerContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 10,
    marginLeft: 20,
    marginRight: 20,
  },
  headerTitle: {
    alignSelf: 'flex-start',
    fontWeight: '400',
    fontSize: 18,
    color: Colors.headerTint,
  },
  headerButtonContainer: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingRight: 15,
  },
  headerButton: {
    paddingLeft: 20,
  },
});

const mapStateToProps = ({ babybook, registration }) => ({
  babybook,
  registration,
});
const mapDispatchToProps = {
  resetBabyBookEntries,
  fetchBabyBookEntries,
  fetchSubject,
};

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(BabyBookScreen);
