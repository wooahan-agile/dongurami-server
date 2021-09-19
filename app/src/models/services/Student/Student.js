'use strict';

const bcrypt = require('bcrypt');

const StudentStorage = require('./StudentStorage');
const Error = require('../../utils/Error');
const Auth = require('../Auth/Auth');
const EmailAuth = require('../Auth/EmailAuth/EmailAuth');
const EmailAuthStorage = require('../Auth/EmailAuth/EmailAuthStorage');

class Student {
  constructor(req) {
    this.body = req.body;
    this.auth = req.auth;
  }

  async login() {
    const client = this.body;

    try {
      const checkedId = await StudentStorage.findOneById(client.id);

      if (checkedId === undefined) {
        return { success: false, msg: '가입된 아이디가 아닙니다.' };
      }

      const comparePassword = bcrypt.compareSync(
        client.password,
        checkedId.password
      );

      if (comparePassword) {
        const clubNum = await StudentStorage.findOneByLoginedId(client.id);
        const jwt = await Auth.createJWT(checkedId, clubNum);

        return { success: true, msg: '로그인에 성공하셨습니다.', jwt };
      }
      return {
        success: false,
        msg: '잘못된 비밀번호입니다.',
      };
    } catch (err) {
      return Error.ctrl(
        '알 수 없는 오류입니다. 서버개발자에게 문의하세요.',
        err
      );
    }
  }

  async signUp() {
    const client = this.body;
    const saltRounds = 10;
    const passwordSalt = bcrypt.genSaltSync(saltRounds);
    const hash = bcrypt.hashSync(client.password, passwordSalt);
    const checkedIdAndEmail = await this.checkIdAndEmail();

    if (checkedIdAndEmail.saveable) {
      const studentInfo = { client, passwordSalt, hash };
      const response = await StudentStorage.save(studentInfo);

      if (response) {
        return { success: true, msg: '회원가입에 성공하셨습니다.' };
      }
    }
    return checkedIdAndEmail;
  }

  async findId() {
    const client = this.body;

    try {
      const clientInfo = {
        name: client.name,
        email: client.email,
      };
      const student = await StudentStorage.findOneByNameAndEmail(clientInfo);

      if (student) {
        return {
          success: true,
          msg: '해당하는 아이디를 확인했습니다.',
          id: student.id,
        };
      }
      return { success: false, msg: '해당하는 아이디가 없습니다.' };
    } catch (err) {
      return Error.ctrl(
        '알 수 없는 오류입니다. 서버개발자에게 문의하세요.',
        err
      );
    }
  }

  async resetPassword() {
    const client = this.body;
    const checkedPassword = await this.checkPassword();

    try {
      if (checkedPassword.success) {
        const saltRounds = 10;
        const passwordSalt = bcrypt.genSaltSync(saltRounds);
        const hash = bcrypt.hashSync(client.checkNewPassword, passwordSalt);
        const clientInfo = {
          id: checkedPassword.student.id,
          hash,
          passwordSalt,
        };
        const student = await StudentStorage.modifyPasswordSave(clientInfo);

        if (student) {
          return { success: true, msg: '비밀번호 변경을 성공하였습니다.' };
        }
      }
      return checkedPassword;
    } catch (err) {
      return Error.ctrl(
        '알 수 없는 오류입니다. 서버개발자에게 문의하세요.',
        err
      );
    }
  }

  async checkIdAndEmail() {
    const client = this.body;

    try {
      const clientInfo = {
        id: client.id,
        email: client.email,
      };
      const student = await StudentStorage.findOneByIdOrEmail(clientInfo);

      if (student === undefined) {
        return { saveable: true };
      }
      if (student.id === client.id) {
        return {
          saveable: false,
          msg: '이미 가입된 아이디입니다.',
        };
      }
      if (student.email === client.email) {
        return {
          saveable: false,
          msg: '이미 가입된 이메일입니다.',
        };
      }
      return {
        saveable: false,
        msg: '서버 에러입니다. 서버개발자에게 문의하세요.',
      };
    } catch (err) {
      return Error.ctrl(
        '알 수 없는 오류입니다. 서버개발자에게 문의하세요.',
        err
      );
    }
  }

  async checkPassword() {
    const client = this.body;
    const studentInfo = this.auth;

    try {
      const studentInfoId = studentInfo.id;
      const student = await StudentStorage.findOneById(studentInfoId);
      const comparePassword = bcrypt.compareSync(
        client.password,
        student.password
      );

      if (comparePassword) {
        if (client.password !== client.newPassword) {
          if (client.newPassword === client.checkNewPassword) {
            return { success: true, msg: '비밀번호가 일치합니다.', student };
          }
          return { success: false, msg: '비밀번호가 일치하지 않습니다.' };
        }
        return {
          success: false,
          msg: '기존 비밀번호와 다른 비밀번호를 설정해주세요.',
        };
      }
      return { success: false, msg: '비밀번호가 틀렸습니다.' };
    } catch (err) {
      return Error.ctrl(
        '알 수 없는 오류입니다. 서버개발자에게 문의하세요.',
        err
      );
    }
  }

  async isExistIdAndEmail() {
    const client = this.body;

    try {
      const checkedId = await StudentStorage.findOneById(client.id);
      const checkedEmail = await StudentStorage.findOneByEmail(client.email);

      if (checkedId === undefined) {
        return { isExist: false, msg: '가입된 아이디가 아닙니다.' };
      }
      if (checkedEmail === undefined) {
        return { isExist: false, msg: '가입된 이메일이 아닙니다.' };
      }

      if (
        checkedId.id !== checkedEmail.id ||
        checkedId.email !== checkedEmail.email
      ) {
        return {
          isExist: false,
          msg: '아이디 또는 이메일이 일치하지 않습니다.',
        };
      }
      return {
        isExist: true,
        msg: '일치',
        id: checkedId.id,
        name: checkedId.name,
      };
    } catch (err) {
      return Error.ctrl(
        '알 수 없는 오류입니다. 서버개발자에게 문의하세요.',
        err
      );
    }
  }

  async findPassword() {
    const client = this.body;

    try {
      // 토큰 검증
      const authInfo = await EmailAuth.useableToken(client.id);
      if (!authInfo.useable) return authInfo;

      // 비밀번호 검증
      const checkedByChangePassword = await this.checkByChangePassword();
      if (!checkedByChangePassword.success) return checkedByChangePassword;

      // 암호화
      const saltRounds = 10;
      const passwordSalt = bcrypt.genSaltSync(saltRounds); // 솔트
      const hash = bcrypt.hashSync(client.checkNewPassword, passwordSalt); // 해시(비밀번호)
      const clientInfo = {
        hash,
        passwordSalt,
        id: client.id,
      };

      // DB 수정
      const isReset = await StudentStorage.modifyPasswordSave(clientInfo);
      if (!isReset) {
        return { success: false, msg: '비밀번호 변경에 실패하였습니다.' };
      }

      // 토큰 삭제 && 비밀번호 변경
      const isDeleteToken = await EmailAuthStorage.deleteTokenByStudentId(
        client.id
      );
      if (!isDeleteToken) {
        return { success: false, msg: '토큰 삭제에 실패하였습니다.' };
      }
      return { success: true, msg: '비밀번호가 변경되었습니다.' };
    } catch (err) {
      return Error.ctrl(
        '알 수 없는 오류입니다. 서버개발자에게 문의하세요.',
        err
      );
    }
  }

  async checkByChangePassword() {
    const client = this.body;

    try {
      if (client.newPassword !== client.checkNewPassword) {
        return { success: false, msg: '비밀번호가 일치하지 않습니다.' };
      }
      if (client.newPassword.length < 8 || client.checkNewPassword.length < 8) {
        return { success: false, msg: '비밀번호가 8자리수 미만입니다.' };
      }
      return { success: true, msg: '비밀번호가 일치합니다' };
    } catch (err) {
      return Error.ctrl(
        '알 수 없는 오류입니다. 서버개발자에게 문의하세요.',
        err
      );
    }
  }
}

module.exports = Student;
