import React, { Component } from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Button } from 'react-native-elements';

import { compose } from 'recompose';
import { Formik } from 'formik';
import * as Yup from 'yup';
import withInputAutoFocus, {
  withNextInputAutoFocusForm,
  withNextInputAutoFocusInput,
} from 'react-native-formik';

import moment from 'moment';

import isEmpty from 'lodash/isEmpty';

import { connect } from 'react-redux';

import { fetchSession, updateSession } from '../actions/session_actions';
import {
  fetchRespondent,
  resetSubject,
  createSubject,
  updateSubject,
  apiCreateSubject,
} from '../actions/registration_actions';
import { fetchMilestoneCalendar } from '../actions/milestone_actions';

import TextFieldWithLabel from './textFieldWithLabel';
import DatePicker from './datePickerInput';
import Picker from './pickerInput';

import Colors from '../constants/Colors';
import States from '../actions/states';
import AppStyles from '../constants/Styles';

const TextField = compose(
  withInputAutoFocus,
  withNextInputAutoFocusInput,
)(TextFieldWithLabel);
const PickerInput = compose(
  withInputAutoFocus,
)(Picker);
const DatePickerInput = compose(
  withInputAutoFocus,
)(DatePicker);

const Form = withNextInputAutoFocusForm(View, { submitAfterLastInput: false });

const validationSchema = Yup.object().shape({
  first_name: Yup.string()
    .required("Your baby's first name is required"),
  last_name: Yup.string()
    .required("Your baby's last name is required"),
  gender: Yup.string()
    .typeError("Your baby's gender is required")
    .required("Your baby's gender is required"),
  conception_method: Yup.string()
    .typeError("Please provide your baby's conception method")
    .required("Please provide your baby's conception method"),
  date_of_birth: Yup.date()
    .typeError("Your baby's date of birth must be a date")
    .required("Your baby's date of birth is required"),
});

const genders = [
  { label: 'Unknown', value: 'unknown' },
  { label: 'Female', value: 'female' },
  { label: 'Male', value: 'male' },
];

const conceptionMethods = [
  { label: 'Natural', value: 'natural' },
  { label: 'IVF', value: 'ivf' },
  { label: 'IUI', value: 'iui' },
  { label: 'ICSI', value: 'icsi' },
];

class RegistrationSubjectForm extends Component {
  constructor(props) {
    super(props);

    this.state = {
      isSubmitting: false,
      dobError: null,
      apiSubjectSubmitted: false,
      reRenderCount: 1,
    };

    this.props.resetSubject();
    this.props.fetchRespondent();
  }

  componentDidMount() {
    const session = this.props.session;
    if (['none', 'unknown'].includes(session.connectionType)) {
      this.setState({ isSubmitting: true, dobError: 'The internet is not currently available' });
    }
  }

  shouldComponentUpdate(nextProps) {
    const session = nextProps.session;
    const { respondent, subject, apiSubject } = nextProps.registration;
    const { calendar } = nextProps.milestones;

    return (
      !session.fetching &&
      !respondent.fetching &&
      !subject.fetching &&
      !apiSubject.fetching &&
      !calendar.fetching
    );
  }

  componentDidUpdate(prevProps, prevState) {
    const session = this.props.session;
    const { subject, apiSubject } = this.props.registration;
    const { calendar } = this.props.milestones;
    const { isSubmitting, apiSubjectSubmitted, reRenderCount } = this.state;
    if (isSubmitting && subject.fetched && !isEmpty(subject.data)) {
      if (!apiSubject.fetched && !apiSubjectSubmitted) {
        this.props.apiCreateSubject(subject.data);
        this.setState({ apiSubjectSubmitted: true });
      }
      if (apiSubjectSubmitted) {
        this.props.fetchMilestoneCalendar();
        console.log({ reRenderCount });
        this.setState({ reRenderCount: reRenderCount + 1 });
      }
      if (!isEmpty(calendar.data) || reRenderCount > 15) {
        const registration_state = States.REGISTERED_AS_IN_STUDY;
        this.props.updateSession({ registration_state });
      }
    }
  }

  _getInitialValues = () => {
    const {
      screening_blood,
      screening_blood_other,
      screening_blood_notification,
      video_presentation,
      video_sharing,
    } = this.props.session;
    let defValues = {}
    if (__DEV__) {
      defValues = {
        date_of_birth: moment().subtract(1, 'years').format("YYYY/MM/DD"),
        first_name: 'Test',
        middle_name: 'Tester',
        last_name: 'Child',
      };
    } else {
      defValues = {
        date_of_birth: null,
        first_name: '',
        middle_name: '',
        last_name: '',
      };
    }
    const initialValues = {
      ...defValues,
      respondent_ids: null,
      gender: 'female',
      conception_method: 'natural',
      outcome: 'live_birth',
      screening_blood,
      screening_blood_other,
      screening_blood_notification,
      video_presentation,
      video_sharing,
    };
    return initialValues;
  };

  render() {
    const respondent = this.props.registration.respondent;
    const {
      screening_blood,
      screening_blood_other,
      screening_blood_notification,
      video_presentation,
      video_sharing,
    } = this.props.session;
    const dobError = this.state.dobError;

    return (
      <Formik
        onSubmit={values => {
          if (values.date_of_birth) {
            const newSubject = {
              ...values,
              respondent_ids: [respondent.data.api_id],
              screening_blood,
              screening_blood_other,
              screening_blood_notification,
              video_presentation,
              video_sharing,
            };
            this.setState({ isSubmitting: true });
            this.props.createSubject(newSubject);
          } else {
            this.setState({ dobError: 'You must provide the Date of Birth' });
          }
        }}
        validationSchema={validationSchema}
        initialValues={this._getInitialValues()}
        render={props => {
          return (
            <Form>
              <Text style={AppStyles.registrationHeader}>
                Step 3: Update Your Baby&apos;s Profile
              </Text>
              <TextField
                autoCapitalize="words"
                label="First Name"
                name="first_name"
                inputStyle={AppStyles.registrationTextInput}
                inputContainerStyle={AppStyles.registrationTextInputContainer}
              />
              <TextField
                autoCapitalize="words"
                label="Middle Name"
                name="middle_name"
                inputStyle={AppStyles.registrationTextInput}
                inputContainerStyle={AppStyles.registrationTextInputContainer}
              />
              <TextField
                autoCapitalize="words"
                label="Last Name"
                name="last_name"
                inputStyle={AppStyles.registrationTextInput}
                inputContainerStyle={AppStyles.registrationTextInputContainer}
              />

              <PickerInput
                label="Gender"
                prompt="Gender"
                name="gender"
                values={genders}
                selectedValue={props.values.gender}
                labelStyle={AppStyles.registrationLabel}
                inputStyle={AppStyles.registrationPickerText}
              />

              <PickerInput
                label="Conception Method"
                prompt="Conception Method"
                name="conception_method"
                values={conceptionMethods}
                selectedValue={props.values.conception_method}
                labelStyle={AppStyles.registrationLabel}
                inputStyle={AppStyles.registrationPickerText}
              />

              <DatePickerInput
                label="Date of Birth"
                name="date_of_birth"
                containerStyle={AppStyles.registrationDateContainer}
                date={props.values.date_of_birth}
                handleChange={ value => {
                  this.setState({ dobError: null });
                  props.setFieldValue('date_of_birth', value);
                }}
                showIcon={false}
                style={{ width: '100%' }}
                customStyles={{
                  dateInput: AppStyles.registrationDateInput,
                  dateText: AppStyles.registrationTextInput,
                }}
              />

              <Text style={styles.errorText}>{dobError}</Text>

              <View style={AppStyles.registrationButtonContainer}>
                <Button
                  title="NEXT"
                  onPress={props.submitForm}
                  buttonStyle={AppStyles.buttonSubmit}
                  titleStyle={ { fontWeight: 900 } }
                  color={Colors.darkGreen}
                  disabled={this.state.isSubmitting}
                />
              </View>
            </Form>
          );
        }}
      />
    );
  }
}

const styles = StyleSheet.create({
  errorText: {
    fontSize: 12,
    marginTop: -20,
    marginBottom: 20,
    color: Colors.errorColor,
  },
});

const mapStateToProps = ({ session, registration, milestones }) => ({
  session,
  registration,
  milestones,
});

const mapDispatchToProps = {
  fetchSession,
  updateSession,
  fetchRespondent,
  resetSubject,
  createSubject,
  updateSubject,
  apiCreateSubject,
  fetchMilestoneCalendar,
};

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(RegistrationSubjectForm);
