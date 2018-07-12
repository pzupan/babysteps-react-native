import React, { Component } from 'react'
import {
  View,
  Image,
  Dimensions,
  StyleSheet
} from 'react-native';

import Colors from '../constants/Colors';
import CONSTANTS from '../constants';

const { width } = Dimensions.get('window');
const widthOffset = 40
const imageOffset = 60

const imageWidth = width - (widthOffset + imageOffset)

class BabyBookGetImage extends Component {

  static IMAGE_WIDTH = imageWidth

  state = {
    imageHeight: imageWidth,
  }

  componentWillReceiveProps(nextProps, nextState) {
    const item = nextProps.item
    if (item.file_name && item.file_uri) {
      Image.getSize(item.file_uri.uri,
        (width, height) => { 
          this.setState({ imageHeight: (imageWidth * ( height / width )) })
        },
        (error) => {
          console.log(error)
        } 
      ) // Image.getSize
    } // if item.file_uri
  }

  render() {

    const imageContainerHeight = this.state.imageHeight + 2

    return(

      <View style={[ styles.imageContainer, { height: imageContainerHeight } ]}>

        <Image 
          style={[ styles.image, { height: this.state.imageHeight } ]}
          source={ this.props.item.file_uri }
        />

        <Image 
          style={styles.imageCornerTopLeft}
          source={ require('../assets/images/baby_book_picture_frame_top_left.png')}
        />
        <Image 
          style={styles.imageCornerTopRight}
          source={ require('../assets/images/baby_book_picture_frame_top_right.png')}
        />
        <Image 
          style={styles.imageCornerBottomLeft}
          source={ require('../assets/images/baby_book_picture_frame_bottom_left.png')}
        />
        <Image 
          style={styles.imageCornerBottomRight}
          source={ require('../assets/images/baby_book_picture_frame_bottom_right.png')}
        />

      </View>
    )
  }
}

const imageCorner = {
  height: 36,
  width: 36,
  position: 'absolute',
}

const styles = StyleSheet.create({
  imageContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    width: imageWidth + 2,
    backgroundColor: Colors.white,
    borderColor: Colors.lightGrey,
    borderWidth: 2,
    padding: 5
  },
  image: {
    width: imageWidth,
  },
  imageCornerTopLeft: {
    ...imageCorner,
    top: -2,
    left: -2,
  },
  imageCornerTopRight: {
    ...imageCorner,
    top: -2,
    right: -2,
  },
  imageCornerBottomLeft: {
    ...imageCorner,
    bottom: -2,
    left: -2,
  },
  imageCornerBottomRight: {
    ...imageCorner,
    bottom: -2,
    right: -2,
  },

})

export default BabyBookGetImage