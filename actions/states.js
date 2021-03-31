// Application state constants

const REGISTERING_ELIGIBILITY = 'registering_eligibility';
const REGISTERING_NOT_ELIGIBLE = 'registering_not_eligible';
const REGISTERING_AS_ELIGIBLE = 'registering_as_eligible';
const REGISTERING_FULL_CONSENT = 'registering_full_consent';
const REGISTERING_UPDATE_CONSENT = 'registering_update_consent';
const REGISTERING_SIGNATURE = 'registering_signature';

const REGISTERING_USER = 'registering_user';
const REGISTERING_RESPONDENT = 'registering_respondent';
const REGISTERING_EXPECTED_DOB = 'registering_expected_dob';
const REGISTERING_SUBJECT = 'registering_subject';

const REGISTERING_AS_NO_STUDY = 'registering_as_no_study';
const REGISTERING_AS_IN_STUDY = 'registering_as_in_study';

const REGISTERED_AS_IN_STUDY = 'registered_as_in_study';
const REGISTERED_AS_NO_STUDY = 'registered_as_no_study';

const REGISTERED_UPDATE_CONSENT = 'registered_update_consent';

export default {
  REGISTERING_ELIGIBILITY,
  REGISTERING_NOT_ELIGIBLE,
  REGISTERING_AS_ELIGIBLE,
  REGISTERING_FULL_CONSENT,
  REGISTERING_SIGNATURE,
  REGISTERING_AS_IN_STUDY,
  REGISTERING_AS_NO_STUDY,
  REGISTERING_NO_STUDY: [
    REGISTERING_AS_NO_STUDY,
    REGISTERING_NOT_ELIGIBLE,
  ],
  REGISTERING_CONSENT: [
    REGISTERING_ELIGIBILITY,
    REGISTERING_AS_ELIGIBLE,
    REGISTERING_FULL_CONSENT,
    REGISTERING_SIGNATURE,
  ],
  REGISTERING_UPDATE_CONSENT,
  REGISTERING_USER,
  REGISTERING_RESPONDENT,
  REGISTERING_EXPECTED_DOB,
  REGISTERING_SUBJECT,
  REGISTERING_REGISTRATION: [
    REGISTERING_USER,
    REGISTERING_RESPONDENT,
    REGISTERING_EXPECTED_DOB,
    REGISTERING_SUBJECT,
  ],

  REGISTERED_AS_IN_STUDY,
  REGISTERED_AS_NO_STUDY,
  REGISTRATION_COMPLETE: [
    REGISTERED_AS_NO_STUDY,
    REGISTERED_AS_IN_STUDY,
  ],
  REGISTERED_UPDATE_CONSENT,
};
