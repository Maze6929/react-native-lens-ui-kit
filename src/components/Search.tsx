import {
  View,
  StyleSheet,
  TextInput,
  FlatList,
  ActivityIndicator
} from 'react-native'
import {
  useState,
  useCallback,
  useContext,
  useEffect
} from 'react'
import {
  SearchType,
  AutoCapitalizeOptions,
  ProfilesQuery,
  PublicationQuery,
  PublicationFetchResults,
  LensContextType,
  ExtendedProfile,
  PublicationStyles,
  ExtendedPublication,
  ProfileMetadata
} from '../types'
import { createClient } from '../api'
import {
  ProfileListItem,
  SearchIcon,
  Publication as PublicationComponent
} from './'
import {
  debounce,
  formatProfilePictures,
  filterMimeTypes,
  configureMirrorAndIpfsUrl
} from '../utils'
import {
  SearchProfilesDocument,
  PaginatedResultInfo,
  ExploreProfilesDocument,
  ProfileSortCriteria,
  PublicationSortCriteria,
  ExplorePublicationsDocument,
  PublicationTypes,
  SearchPublicationsDocument,
  SearchRequestTypes
} from '../graphql/generated'
import { LensContext } from '../context'

export function Search({
  searchType = SearchType.publication,
  styles = baseStyles,
  placeholder = 'Search',
  autoCapitalize = AutoCapitalizeOptions.none,
  selectionColor = '#b0b0b0',
  infiniteScroll = true,
  ListFooterComponent,
  publicationStyles,
  signedInUser,
  hideLikes = false,
  hideComments = false,
  hideMirrors = false,
  hideCollects = false,
  iconColor,
  profileQuery = {
    profileSortCriteria: ProfileSortCriteria.MostFollowers,
    limit: 25
  },
  publicationQuery = {
    publicationTypes: [PublicationTypes.Post, PublicationTypes.Comment, PublicationTypes.Mirror],
    publicationSortCriteria: PublicationSortCriteria.Latest,
    limit: 5
  },
  onEndReachedThreshold = .65,
  onFollowPress  = profile => console.log({ profile }),
  onProfilePress = profile => console.log({ profile }),
  onCollectPress = publication => console.log({ publication }),
  onCommentPress = publication => console.log({ publication }),
  onMirrorPress = publication => console.log({ publication }),
  onLikePress = publication => console.log({ publication }),
  onProfileImagePress = publication => console.log({ publication }),
} : {
  searchType?: SearchType,
  styles?: any,
  placeholder?: string,
  autoCapitalize?: AutoCapitalizeOptions,
  selectionColor?: string,
  ListFooterComponent?: React.FC,
  iconColor?: string,
  profileQuery?: ProfilesQuery,
  publicationQuery?: PublicationQuery,
  infiniteScroll?: boolean,
  onEndReachedThreshold?: number,
  publicationStyles?: PublicationStyles,
  signedInUser?: ProfileMetadata,
  hideLikes?: any,
  hideComments?: boolean,
  hideMirrors?: boolean,
  hideCollects?: boolean,
  onCollectPress?: (publication: ExtendedPublication) => void,
  onCommentPress?: (publication: ExtendedPublication) => void,
  onMirrorPress?: (publication: ExtendedPublication) => void,
  onLikePress?: (publication: ExtendedPublication) => void,
  onProfileImagePress?: (publication: ExtendedPublication) => void,
  onFollowPress?: (profile: ExtendedProfile, profiles: ExtendedProfile[]) => void,
  onProfilePress?: (profile: ExtendedProfile) => void
}) {
  const [searchString, updateSearchString] = useState<string>('')
  const [paginationInfo, setPaginationInfo] = useState<PaginatedResultInfo | undefined>()
  const [profiles, setProfiles] = useState<ExtendedProfile[]>([])
  const [publications, setPublications] = useState<ExtendedPublication[]>([])
  const [loading, setLoading] = useState<boolean>(false)
  const [canPaginate, setCanPaginate] = useState<boolean>(true)

  const { environment } = useContext<LensContextType>(LensContext)
  const client = createClient(environment)

  useEffect(() => {
    if (searchType === SearchType.profile) {
      fetchProfiles()
    } else {
      fetchPublications()
    }
  }, [searchType])

  async function fetchProfiles(cursor?: string) {
    setLoading(true)
    try {
      const { data } = await client.query(ExploreProfilesDocument, {
        request: {
          sortCriteria: profileQuery.profileSortCriteria || ProfileSortCriteria.MostFollowers,
          limit: profileQuery.limit,
          cursor
        }
      }).toPromise()
      if (data && data.exploreProfiles.__typename === 'ExploreProfileResult') {
        let {
          items, pageInfo
        } = data.exploreProfiles as any
        setPaginationInfo(pageInfo)
        items = formatProfilePictures(items)
        if (cursor) {
          let newData = [...profiles, ...items]
          setProfiles(newData)
        } else {
          setProfiles(items)
        }
        setLoading(false)
      }
    } catch (err) {
      console.log('error fetching profiles...:', err)
    }
  }

  async function fetchPublications(cursor?: string) {
    setLoading(true)
    try {
      const {
        data
      } = await client.query(ExplorePublicationsDocument, {
        request: {
          publicationTypes: publicationQuery.publicationTypes,
          limit: publicationQuery.limit,
          sortCriteria: publicationQuery.publicationSortCriteria || PublicationSortCriteria.Latest,
          cursor,
        }
      }).toPromise()
      if (data && data.explorePublications.__typename === 'ExplorePublicationResult') {
        let {
          items, pageInfo
        } = data.explorePublications as PublicationFetchResults
        setPaginationInfo(pageInfo)
        items = filterMimeTypes(items)
        items = configureMirrorAndIpfsUrl(items)
        if (cursor) {
          let newData = [...publications, ...items]
          if (publicationQuery.publicationSortCriteria === "LATEST") {
            newData = [...new Map(newData.map(m => [m.id, m])).values()]
          }
          setPublications(newData)
        } else {
          setPublications(items)
        }
        setLoading(false)
      }
    } catch (err) {
      console.log('error fetching publications... ', err)
      setLoading(false)
    }
  }

  async function searchPublications(value: string, cursor?: string) {
    try {
      const {
        data
      } = await client.query(SearchPublicationsDocument, {
        request: {
          type: SearchRequestTypes.Publication,
          query: value,
          limit: publicationQuery.limit,
          cursor,
        }
      }).toPromise()
    } catch (err) {

    }
  }

  function onEndReached() {
    if (infiniteScroll) {
      fetchNextItems()
    }
  }

  async function fetchNextItems() {
    try {
     if (canPaginate && paginationInfo) {
       const { next } = paginationInfo
       if (!next) {
        setCanPaginate(false)
       } else {
         if (searchType === SearchType.profile) {
           if (searchString) {
            searchProfiles(searchString, next)
           } else {
            fetchProfiles(next)
           }
         }
         if (searchType === SearchType.publication) {
           if (searchString) {
             searchPublications(searchString, next)
           } else {
             fetchPublications(next)
           }
         }
       }
     }
    } catch (err) {
     console.log('Error fetching next items:', err)
    }
  }

  async function searchProfiles(value: string, cursor?: string) {
    try {
      setLoading(true)
      const { data } = await client.query(SearchProfilesDocument, {
        request: {
          query: value,
          type: SearchRequestTypes.Profile,
          cursor
        }
      }).toPromise()
      if (data && data.search.__typename === 'ProfileSearchResult') {
        setPaginationInfo(data.search.pageInfo)
        let items = data.search.items as ExtendedProfile[]
        items = formatProfilePictures(items)
        if (cursor) {
          let newData = [...profiles, ...items]
          setProfiles(newData)
        } else {
          setProfiles(items)
        }
        setLoading(false)
      }
    } catch (err) {
      setLoading(false)
      console.log('error searching...', err)
    }
  }

  function renderProfile({ item, index} : {
    item: ExtendedProfile,
    index: number
  }) {
    return (
      <ProfileListItem
        key={index}
        onProfilePress={onProfilePress}
        profile={item}
        onFollowPress={(profile: ExtendedProfile) => onFollowPress(profile, profiles)}
        isFollowing={item.isFollowing}
      />
    )
  }
  
  function renderPublication({
    item, index
  } : {
    item: ExtendedPublication,
    index: number
  }) {
    return (
      <PublicationComponent
        styles={publicationStyles}
        key={index}
        publication={item}
        signedInUser={signedInUser}
        onCollectPress={onCollectPress}
        onCommentPress={onCommentPress}
        onMirrorPress={onMirrorPress}
        onLikePress={onLikePress}
        hideLikes={hideLikes}
        hideComments={hideComments}
        hideMirrors={hideMirrors}
        hideCollects={hideCollects}
        onProfileImagePress={onProfileImagePress}
        iconColor={iconColor}
      />
    )
  }

  const onChangeText = (value:string) => {
    updateSearchString(value)
    if (searchType === SearchType.profile) {
      searchProfiles(value)
    } else {
      searchPublications(value)
    }
  }

  const callback = useCallback(debounce(onChangeText, 400), []);

  return (
    <View style={styles.containerStyle}>
      <View style={styles.inputContainerStyle}>
        <View style={styles.inputWrapperStyle}>
          <SearchIcon />
          <TextInput
            onChangeText={callback}
            style={styles.inputStyle}
            placeholder={placeholder}
            autoCapitalize={autoCapitalize}
            autoCorrect={false}
            clearButtonMode='while-editing'
            selectionColor={selectionColor}
          />
        </View>
      </View>
      {
        searchType === SearchType.profile ? (
          <FlatList
            data={profiles}
            renderItem={renderProfile}
            onEndReached={onEndReached}
            initialNumToRender={25}
            keyExtractor={(_, index) => String(index)}
            onEndReachedThreshold={onEndReachedThreshold}
            ListFooterComponent={
              ListFooterComponent ?
              ListFooterComponent :
              loading ? (
                <ActivityIndicator
                  style={styles.loadingIndicatorStyle}
                />
              ) : null
            }
         />
        ) : (
          <FlatList
            data={publications}
            renderItem={renderPublication}
            onEndReached={onEndReached}
            initialNumToRender={25}
            keyExtractor={(_, index) => String(index)}
            onEndReachedThreshold={onEndReachedThreshold}
            ListFooterComponent={
              ListFooterComponent ?
              ListFooterComponent :
              loading ? (
                <ActivityIndicator
                  style={styles.loadingIndicatorStyle}
                />
              ) : null
            }
        />
        )
      }

    </View>
  )
}

const baseStyles = StyleSheet.create({
  containerStyle: {},
  inputContainerStyle: {
    alignItems: 'center',
    backgroundColor: 'white',
    marginBottom: 8
  },
  inputWrapperStyle: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '95%',
    paddingLeft: 15,
    backgroundColor: 'rgba(0, 0, 0, .065)',
    borderRadius: 30,
    height: 40,
    paddingRight: 10
  },
  inputStyle: {
    marginLeft: 8,
    flex: 1
  },
  loadingIndicatorStyle : {
    marginVertical: 20
  }
})

const darkThemeStyles = StyleSheet.create({

})