import {
  TouchableHighlight, View, Image, Text, StyleSheet
} from 'react-native'

export function ProfileListItem({
  profile,
  onProfilePress,
  onFollowPress,
  isFollowing
}) {
  return (
    <TouchableHighlight
        activeOpacity={0.8}
        onPress={() => onProfilePress(profile)}
        underlayColor="transparent"
        key={profile.id}
      >
        <View style={styles.container}>
          <View style={styles.avatarContainer}>
            <Image
              source={{
                uri: profile?.picture?.original?.url || "https://source.unsplash.com/random/200x200?sig=1"
              }}
              style={styles.avatar}
            />
          </View>
          <View style={styles.infoContainer}>
            <Text style={styles.profileName}>{profile.name || profile.handle}</Text>
            <Text style={styles.profileHandle}>{profile.handle}</Text>
            <Text style={styles.profileBio}>{profile.bio && profile.bio.substring(0, 150)}</Text>
            
          </View>
          <View style={styles.followButtonContainer}>
            <TouchableHighlight
              underlayColor="transparent"
              onPress={() => onFollowPress(profile)}
              activeOpacity={0.6}
            >
              {
                renderFollowButton(isFollowing)
              }
            </TouchableHighlight>
          </View>
        </View>
      </TouchableHighlight>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    paddingLeft: 15,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, .06)'
  },
  avatarContainer: {
    padding: 5
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22
  },
  profileName: {
    fontWeight: '600',
    fontSize: 16,
    maxWidth: 200
  },
  profileHandle: {
    marginTop: 3,
    axWidth: 200
  },
  profileBio: {
    maxWidth: 200,
    marginTop: 15,
    color: 'rgba(0, 0, 0, .5)'
  },
  infoContainer: {
    justifyContent: 'center',
    paddingLeft: 10
  },
  followButtonContainer: {
    flex: 1,
    alignItems: 'flex-end', 
    paddingRight: 20
  },
  followButton: {
    borderWidth: 1,
    borderRadius: 30,
    paddingHorizontal: 15,
    paddingVertical:5,
    marginTop: 5,
    backgroundColor: 'black',
  },
  followingButton: {
    borderWidth: 1,
    borderRadius: 30,
    paddingHorizontal: 15,
    paddingVertical:5,
    marginTop: 5,
  },
  followButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: 'white'
  },
  followingButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: 'black'
  }
})

function renderFollowButton(isFollowing) {
  if (isFollowing) {
    return (
      <View style={styles.followingButton}>
        <Text style={styles.followingButtonText}>
          Following
        </Text>
      </View>
    )
  } else {
    return (
      <View style={styles.followButton}>
        <Text style={styles.followButtonText}>
          Follow
        </Text>
      </View>
    )
  }
}