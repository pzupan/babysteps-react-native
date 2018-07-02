import { SQLite } from 'expo';
import axios from "axios";

import { _ } from 'lodash';

import CONSTANTS from '../constants';

import {

  FETCH_USER_PENDING,
  FETCH_USER_FULFILLED,
  FETCH_USER_REJECTED,

  CREATE_USER_PENDING,
  CREATE_USER_FULFILLED,
  CREATE_USER_REJECTED,

  API_CREATE_USER_PENDING,
  API_CREATE_USER_FULFILLED,
  API_CREATE_USER_REJECTED,

  FETCH_RESPONDENT_PENDING,
  FETCH_RESPONDENT_FULFILLED,
  FETCH_RESPONDENT_REJECTED,

  CREATE_RESPONDENT_PENDING,
  CREATE_RESPONDENT_FULFILLED,
  CREATE_RESPONDENT_REJECTED,

  UPDATE_RESPONDENT_PENDING,
  UPDATE_RESPONDENT_FULFILLED,
  UPDATE_RESPONDENT_REJECTED,

  API_CREATE_RESPONDENT_PENDING,
  API_CREATE_RESPONDENT_FULFILLED,
  API_CREATE_RESPONDENT_REJECTED,

  API_UPDATE_RESPONDENT_PENDING,
  API_UPDATE_RESPONDENT_FULFILLED,
  API_UPDATE_RESPONDENT_REJECTED,

  SAVE_SIGNATURE_PENDING,
  SAVE_SIGNATURE_FULFILLED,
  SAVE_SIGNATURE_REJECTED,

  RESET_SUBJECT,

  FETCH_SUBJECT_PENDING,
  FETCH_SUBJECT_FULFILLED,
  FETCH_SUBJECT_REJECTED,

  CREATE_SUBJECT_PENDING,
  CREATE_SUBJECT_FULFILLED,
  CREATE_SUBJECT_REJECTED,

  UPDATE_SUBJECT_PENDING,
  UPDATE_SUBJECT_FULFILLED,
  UPDATE_SUBJECT_REJECTED,

  API_CREATE_SUBJECT_PENDING,
  API_CREATE_SUBJECT_FULFILLED,
  API_CREATE_SUBJECT_REJECTED,

} from './types';

const db = SQLite.openDatabase('babysteps.db');

const Pending = (type) => {
  return { type }
};

const Response = ( type, payload, formData={} ) => {
  return { type, payload, formData }
};

export const fetchRegistrationData = () => {
  // Thunk middleware knows how to handle functions.
  return function (dispatch) {
    
    fetchUser()
    .then( () => {
      fetchRespondent()
    })
    .then( () => {
      fetchSubject()
    })

  }
}

export const fetchUser = () => {
  return function (dispatch) {
    
    dispatch( Pending(FETCH_USER_PENDING) );

    return (
      db.transaction(tx => {
        tx.executeSql( 
          `SELECT * FROM users LIMIT 1;`, [],
          (_, response) => { dispatch( Response(FETCH_USER_FULFILLED, response) ) },
          (_, error) => { dispatch( Response(FETCH_USER_REJECTED, error) ) }
        );
      })
    )
  };

};

export const createUser = (user) => {
  return function (dispatch) {

    dispatch( Pending(CREATE_USER_PENDING) );

    return (
      db.transaction(tx => {
        tx.executeSql( 'DELETE FROM users', [], 
          (_, rows) => console.log('** Clear users table'), 
          (_, error) => console.log('*** Error in clearing users table')
        );
        tx.executeSql( 
          'INSERT INTO users (api_id, email, password, first_name, last_name) VALUES (?, ?, ?, ?, ?);', 
          [user.api_id, user.email, user.password, user.first_name, user.last_name],
          (_, response) => { 
            dispatch( Response(CREATE_USER_FULFILLED, response, user) );
          },
          (_, error) => { 
            dispatch( Response(CREATE_USER_REJECTED, error) ) 
          }
        );
      })
    )
  };
};

export const apiCreateUser = (user) => {
 
  return function (dispatch) {

    dispatch( Pending(API_CREATE_USER_PENDING) );

    return ( 
      
      axios({
        method: 'POST',
        responseType: 'json',
        baseURL: CONSTANTS.BASE_URL,
        url: '/user_registration',
        data: user,
      })
      .then(function (response) {
        dispatch( Response(API_CREATE_USER_FULFILLED, response, user) );
      })
      .catch(function (error) {
        dispatch( Response(API_CREATE_USER_REJECTED, error) );
      })
    
    ) 
  }
};

export const fetchRespondent = () => {
  return function (dispatch) {
    
    dispatch( Pending(FETCH_RESPONDENT_PENDING) );

    return (
      db.transaction(tx => {
        tx.executeSql( 
          `SELECT * FROM respondents LIMIT 1;`, [],
          (_, response) => { dispatch( Response(FETCH_RESPONDENT_FULFILLED, response) ) },
          (_, error) => { dispatch( Response(FETCH_RESPONDENT_REJECTED, error) ) }
        );
      })
    )
  };

};

export const createRespondent = (respondent) => {
  return function (dispatch) {

    dispatch( Pending(CREATE_RESPONDENT_PENDING) );

    return (
      db.transaction(tx => {
        tx.executeSql( 'DELETE FROM respondents', [], 
          (_, rows) => console.log('** Clear respondents table'), 
          (_, error) => console.log('*** Error in clearing respondents table')
        );
        const sql = 'INSERT INTO respondents ( \
          user_id, \
          respondent_type, \
          first_name, \
          last_name, \
          middle_name, \
          address_1, \
          address_2, \
          city, \
          state, \
          zip_code, \
          country_code, \
          email, \
          home_phone, \
          other_phone, \
          date_of_birth, \
          drivers_license_number, \
          marital_status, \
          weight, \
          height \
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);'
        const values = [
          respondent.user_id,
          respondent.respondent_type,
          respondent.first_name,
          respondent.last_name,
          respondent.middle_name,
          respondent.address_1,
          respondent.address_2,
          respondent.city,
          respondent.state,
          respondent.zip_code,
          'USA',
          respondent.email,
          respondent.home_phone,
          respondent.other_phone,
          respondent.date_of_birth,
          respondent.drivers_license_number,
          respondent.marital_status,
          respondent.weight,
          respondent.height
        ]
        tx.executeSql( sql, values,
          (_, response) => { 
            dispatch( Response(CREATE_RESPONDENT_FULFILLED, response, respondent) );
          },
          (_, error) => { 
            dispatch( Response(CREATE_RESPONDENT_REJECTED, error) ) 
          }
        );
      })
    )
  };
}

export const apiCreateRespondent = (session, data) => {
  
  delete data.id 
  delete data.api_id 

  return function (dispatch) {
    
    dispatch({
      type: API_CREATE_RESPONDENT_PENDING,
      payload: {
        data: {respondent: data},
        session: session
      },
      meta: {
        offline: {
          effect: { 
            method: 'POST',
            url: '/respondents',
            fulfilled: API_CREATE_RESPONDENT_FULFILLED,
            rejected: API_CREATE_RESPONDENT_REJECTED,
          }
        }
      }
    })

  }
}

export const updateRespondent = (data) => {
  return function (dispatch) {

    dispatch( Pending(UPDATE_RESPONDENT_PENDING) );

    delete data.id 
    
    const keys = _.keys(data);
    const values = _.values(data);
    var updateSQL = []

    _.forEach( keys, (key) => {
      updateSQL.push( key + " = '" + data[key] + "'" )
    })

    return (
      db.transaction(tx => {
        tx.executeSql( 'UPDATE respondents SET ' + updateSQL.join(', ') + ';', 
          [],
          (_, response) => { 
            dispatch( Response(UPDATE_RESPONDENT_FULFILLED, response, data) );
          },
          (_, error) => { 
            dispatch( Response(UPDATE_RESPONDENT_REJECTED, error) ) 
          }
        );
      })
    )
  };
}

export const apiUpdateRespondent = (session, data) => {
  const api_id = data.api_id
  delete data.id 
  delete data.api_id 

  return function (dispatch) {
    
    dispatch({
      type: API_UPDATE_RESPONDENT_PENDING,
      payload: {
        data: {respondent: data},
        session: session
      },
      meta: {
        offline: {
          effect: { 
            method: 'PUT',
            url: '/respondents/' + api_id,
            fulfilled: API_UPDATE_RESPONDENT_FULFILLED,
            rejected: API_UPDATE_RESPONDENT_REJECTED,
          }
        }
      }
    })

  }
}

export const saveSignature = (image) => {
  return function (dispatch) {
    
    dispatch( Pending(SAVE_SIGNATURE_PENDING) );

    const fileName = Expo.FileSystem.cacheDirectory + 'signature/signature.png'
    Expo.FileSystem.deleteAsync(fileName, { idempotent:  true });

    Expo.FileSystem.copyAsync({from: image.uri, to: fileName})
    .then( () => { dispatch( Pending(SAVE_SIGNATURE_FULFILLED) ) })
    .catch( (error) => { 
      dispatch( Response(SAVE_SIGNATURE_REJECTED, error) ) 
    }) 
  }
}

export const saveScreenBlood = (screeningBlood) => {
  return function (dispatch) {
    dispatch( Pending(UPDATE_SUBJECT_PENDING) );
    dispatch( Response(UPDATE_SUBJECT_FULFILLED, screeningBlood))
  }
}

export const resetSubject = () => {
  return function (dispatch) {
    dispatch( Pending(RESET_SUBJECT))
  }
}

export const fetchSubject = () => {
  return function (dispatch) {
    
    dispatch( Pending(FETCH_SUBJECT_PENDING) );

    return (
      db.transaction(tx => {
        tx.executeSql( 
          `SELECT * FROM subjects LIMIT 1;`, [],
          (_, response) => { dispatch( Response(FETCH_SUBJECT_FULFILLED, response) ) },
          (_, error) => { dispatch( Response(FETCH_SUBJECT_REJECTED, error) ) }
        );
      })
    )
  };

};

export const createSubject = (subject) => {
 return function (dispatch) {

    dispatch( Pending(CREATE_SUBJECT_PENDING) );

    return (
      db.transaction(tx => {
        tx.executeSql( 'DELETE FROM subjects', [], 
          (_, rows) => console.log('** Clear subjects table'), 
          (_, error) => console.log('*** Error in clearing subjects table')
        );
        const sql = 'INSERT INTO subjects ( \
          first_name, \
          last_name, \
          middle_name, \
          gender, \
          conception_method, \
          expected_date_of_birth, \
          date_of_birth, \
          days_premature \
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?);'
        const values = [
          subject.first_name,
          subject.last_name,
          subject.middle_name,
          subject.gender,
          subject.conception_method,
          subject.expected_date_of_birth,
          subject.date_of_birth,
          subject.days_premature
        ]
        tx.executeSql( sql, values,
          (_, response) => { 
            dispatch( Response(CREATE_SUBJECT_FULFILLED, response, subject) );
          },
          (_, error) => { 
            dispatch( Response(CREATE_SUBJECT_REJECTED, error) ) 
          }
        );
      })
    )
  };
}

export const apiCreateSubject = (session, data) => {
  delete data.id 
  delete data.api_id 
  return function (dispatch) {
    
    dispatch({
      type: API_CREATE_SUBJECT_PENDING,
      payload: {
        data: {subject: data},
        session: session
      },
      meta: {
        offline: {
          effect: { 
            method: 'POST',
            url: '/subjects',
            fulfilled: API_CREATE_SUBJECT_FULFILLED,
            rejected: API_CREATE_SUBJECT_REJECTED,
          }
        }
      }
    })

  }
}