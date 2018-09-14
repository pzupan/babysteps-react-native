import React from 'react';
import { Text, View, StyleSheet, TextInput } from 'react-native';
import {FormLabel, FormInput, FormValidationMessage} from 'react-native-elements'
import InputHelper from '../components/inputHelper';
import Colors from '../constants/Colors';

export default class TextFieldWithLabel extends React.PureComponent {
  // Your custom input needs a focus function for `withNextInputAutoFocus` to work

  constructor(props) {
    super(props);
    this.onPress = this.focus.bind(this)
  }

  focus() {
    this.input.focus();
  }

  render() {
    const { error, helper, touched, ...props } = this.props;
    const displayError = !!error && touched;

    const labelColor = displayError ? Colors.errorColor : Colors.textColor;

    let containerProps = {
      style: this.props.containerStyle,
      onStartShouldSetResponder: () => true,
      onResponderRelease: this.onPress,
    };

    return (
      <View {...containerProps}>
        <FormLabel>{this.props.label}</FormLabel>
        <FormInput
          ref={input => (this.input = input)}
          autoCapitalize="none"
          autoCorrect={false}
          {...props}
        />
        <InputHelper
          displayError={displayError}
          helper={helper}
          error={error}
        />
      </View>

    );
  }
}