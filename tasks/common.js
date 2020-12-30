import * as FileSystem from 'expo-file-system';
import axios from 'axios';
import * as SQLite from 'expo-sqlite';
import { Buffer } from "buffer";

import Constants from 'expo-constants';

const db = SQLite.openDatabase('babysteps.db');

export const getFileMetaData = async attachment => {
  if (!attachment.size || !attachment.checksum) {
    attachment = await calculateChecksum(attachment);
  }

  let blob = await getBlob(attachment.uri);
  console.log("Blob", blob.size)
  return {
    blob: {
      checksum: 'uzZTJeOCpiEcBDYa81YqXA==',
      filename: attachment.filename,
      content_type: attachment.content_type,
      byte_size: blob.size,
    },
  };
};

const calculateChecksum = async attachment => {
  const resultInfo = await FileSystem.getInfoAsync(attachment.uri, {
    md5: true,
  });

  console.log('MD5',resultInfo.md5, Buffer.from(resultInfo.md5, "hex"), Buffer.from(resultInfo.md5, "hex").toString("base64"))

  const checksum = Buffer.from(resultInfo.md5, "hex").toString("base64");
  return { ...attachment, size: resultInfo.size, checksum };
};

export const getBlob = async uri => {
  const file = await fetch(uri);
  const blob = await file.blob();
  return blob;
};

export const getAnswer = async answer_id => {
  let answer = {};
  await new Promise((resolve, reject) => {
    db.transaction(tx => {
      tx.executeSql(
        `SELECT * FROM answers WHERE id = ${answer_id};`,
        [],
        (_, result) => resolve(result.rows._array),
        (_, error) => {
          console.log({error});
        },
      );
    });
  }).then(result => {
    answer = result[0];
  });
  return answer;
};

export const setAttachmentToUploaded = attachment => {
  return new Promise((resolve, reject) => {
    db.transaction(tx => {
      tx.executeSql(
        `UPDATE attachments SET uploaded = 1 WHERE id = ${attachment.id}`,
        [],
        (_, result) => resolve(result),
        (_, error) => {
          console.log({error});
        },
      );
    });
  });
};
