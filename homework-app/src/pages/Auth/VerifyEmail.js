import React, { Component } from 'react';

import Input from '../../components/Form/Input/Input';
import Button from '../../components/Button/Button';
import { required, length, email } from '../../util/validators';
import Auth from './Auth';

class VerifyEmail extends Component {
  render() {
    return (
      <Auth>
        <form onSubmit={e => this.props.onVerifyEmail(e, this.state)}>
          <Button design="raised" type="submit" loading={this.props.loading}>
            Verify Email
          </Button>
        </form>
      </Auth>
    );
  }
}

export default VerifyEmail;
