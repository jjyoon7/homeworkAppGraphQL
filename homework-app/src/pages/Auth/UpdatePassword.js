import React, { useState } from 'react';

import Input from '../../components/Form/Input/Input';
import Button from '../../components/Button/Button';
import { required, length, email } from '../../util/validators';
import Auth from './Auth';
import { useParams } from 'react-router-dom';


export default function UpdatePassword() {
  const [ newPassword, setNewPassword ] = useState('')
  const { refreshToken } = useParams()


  const onChangePassword = (e) => setNewPassword(e.target.value)

  const updatePasswordHandler = (e) => {
    e.preventDefault();

    const resetPasswordToken = refreshToken

    console.log('resetPasswordToken', resetPasswordToken)
    console.log('new password value', newPassword)

    const graphqlQuery = {
      query: `
          mutation UpdateNewPassword( $newPassword: String!, $resetPasswordToken: String! ){
            updatePassword(newPassword: $newPassword, resetPasswordToken: $resetPasswordToken) {
                                    _id
                                  }
          }
      `,
      variables: {
        newPassword: newPassword,
        resetPasswordToken: resetPasswordToken
      }
    }
    fetch('http://localhost:5000/graphql', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(graphqlQuery)
    })
      .then(res => {
        return res.json();
      })
      .then(resData => {
        if (resData.errors && resData.errors[0].status === 422) {
          throw new Error(
            "Validation failed. Make sure the email address isn't used yet!"
          );
        }
        if (resData.errors) {
          throw new Error('Updating password failed!');
        }
        console.log(resData)
        // this.props.history.replace('/');
      })
      .catch(err => {
      });
  };
  return (
    <Auth>
    <form onSubmit={updatePasswordHandler}>
      <input type="text" 
             value={newPassword}
             onChange={onChangePassword}    
                    />
      <Button design="raised" type="submit">
        Update Password
      </Button>
    </form>
  </Auth>
  )
}
