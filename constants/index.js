//const BASE_DEVELOPMENT_URL = 'https://staging-api.babystepsapp.net';
//const BASE_DEVELOPMENT_URL = 'https://api.babystepsapp.net';
const BASE_DEVELOPMENT_URL = 'http://192.168.86.44:3000';

export default {
  RESET_STATE: false,
  COMPRESS_MILESTONE_CALENDAR: false,
  TESTING_ENABLE_ALL_TASKS: true,
  TESTING_MOCK_DISABLE_NETWORK: false,
  USE_PUSH_NOTIFICATIONS: true,

  STUDY_ID: 1,
  TASK_BIRTH_QUESTIONAIRE_ID: 25,
  CHOICE_BABY_ALIVE_ID: 613,
  PRE_BIRTH_BEGINNING_OF_STUDY: 373,
  POST_BIRTH_END_OF_STUDY: 730,

  // Custom Directories
  BABYBOOK_DIRECTORY: 'babybook',
  REMOVE_BABYBOOK_DIRECTORY: false, // will delete all baby book assets!
  SIGNATURE_DIRECTORY: 'signature',
  REMOVE_SIGNATURE_DIRECTORY: false, // will delete the signature assets
  ATTACHMENTS_DIRECTORY: 'attachments',
  REMOVE_ATTACHMENTS_DIRECTORY: false, // will delete all answer attachments

  // API
  BASE_DEVELOPMENT_URL,
};
