import { createContext, useState, useContext, ReactNode, useEffect, useRef, useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { IPlayerContext } from '@/types/playerContext'
import { ISong } from '@/types/responses/song'
import { shuffleSongList } from '@/utils/shuffleArray'
import { subsonic } from '@/service/subsonic'
import { manageMediaSession } from '@/utils/setMediaSession'
import { Radio } from '@/types/responses/radios'

const PlayerContext = createContext({} as IPlayerContext)

export function PlayerContextProvider({ children }: { children: ReactNode }) {
  const [originalSongList, setOriginalSongList] = useState<ISong[]>([])
  const [shuffledSongList, setShuffledSongList] = useState<ISong[]>([])
  const [currentSongList, setCurrentSongList] = useState<ISong[]>([])
  const [currentSongIndex, setCurrentSongIndex] = useState(0)
  const [originalSongIndex, setOriginalSongIndex] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isLoopActive, setIsLoopActive] = useState(false)
  const [isShuffleActive, setIsShuffleActive] = useState(false)
  const [isSongStarred, setIsSongStarred] = useState(false)
  const [progress, setProgress] = useState(0)
  const [currentDuration, setCurrentDuration] = useState(0)
  const [mediaType, setMediaType] = useState<'song' | 'radio'>('song')
  const [radioList, setRadioList] = useState<Radio[]>([])
  const isScrobbleSentRef = useRef(false)

  const { t } = useTranslation()
  const radioLabel = t('radios.label')

  useEffect(() => {
    if (currentSongList.length > 0 && mediaType === 'song') {
      isScrobbleSentRef.current = false

      const currentSong = getCurrentSong()
      const starredStatus = currentSong.starred ? true : false
      setIsSongStarred(starredStatus)

      manageMediaSession.setMediaSession(currentSong)
    }
  }, [currentSongList, currentSongIndex])

  useEffect(() => {
    if (radioList.length > 0 && mediaType === 'radio') {
      const radioName = radioList[currentSongIndex].name
      manageMediaSession.setRadioMediaSession(radioLabel, radioName)
    }
  }, [radioList, currentSongIndex])

  useEffect(() => {
    manageMediaSession.setPlaybackState(isPlaying)
  }, [isPlaying])

  useEffect(() => {
    if (mediaType === 'song') {
      const progressPercentage = (progress / currentDuration) * 100

      if (progressPercentage >= 50 && !isScrobbleSentRef.current) {
        sendScrobble(getCurrentSong().id)
        isScrobbleSentRef.current = true
      }
    }
  }, [progress, currentDuration])

  const sendScrobble = useCallback(async (songId: string) => {
    await subsonic.scrobble.send(songId)
  }, [])

  const playSong = useCallback((song: ISong) => {
    if (checkActiveSong(song.id) && !isPlaying) {
      setIsPlaying(true)
      return
    }
    setMediaType('song')
    setCurrentSongList([song])
    setCurrentSongIndex(0)
    setIsShuffleActive(false)
    setIsPlaying(true)
  }, [isPlaying])

  const setSongList = useCallback((songlist: ISong[], index: number, shuffle = false) => {
    setOriginalSongList(songlist)
    setOriginalSongIndex(index)
    setMediaType('song')

    if (shuffle) {
      const shuffledList = shuffleSongList(songlist, index, true)
      setShuffledSongList(shuffledList)

      setCurrentSongList(shuffledList)
      setCurrentSongIndex(0)
      setIsShuffleActive(true)
    } else {
      setCurrentSongList(songlist)
      setCurrentSongIndex(index)
      if (isShuffleActive) setIsShuffleActive(false)
    }

    setIsPlaying(true)
  }, [])

  const togglePlayPause = useCallback(() => {
    setIsPlaying(prevState => !prevState)
  }, [])

  const toggleLoop = useCallback(() => {
    setIsLoopActive(prevState => !prevState)
  }, [])

  const toggleShuffle = useCallback(() => {
    if (isShuffleActive) {
      const currentSongId = currentSongList[currentSongIndex].id
      const index = originalSongList.findIndex(song => song.id === currentSongId)

      setCurrentSongList(originalSongList)
      setCurrentSongIndex(index)
    } else {
      const songListToShuffle = currentSongList.slice(currentSongIndex)
      const shuffledList = shuffleSongList(songListToShuffle, 0)

      setShuffledSongList(shuffledList)
      setCurrentSongList(shuffledList)
      setCurrentSongIndex(0)
    }
    setIsShuffleActive(prevState => !prevState)
  }, [isShuffleActive, currentSongIndex, currentSongList, originalSongList])

  const clearPlayerState = useCallback(() => {
    setOriginalSongList([])
    setShuffledSongList([])
    setCurrentSongList([])
    setRadioList([])
    setOriginalSongIndex(0)
    setCurrentSongIndex(0)
    setIsPlaying(false)
    setIsLoopActive(false)
    setIsShuffleActive(false)
    setProgress(0)
    setCurrentDuration(0)
    manageMediaSession.setPlaybackState(null)
  }, [])

  const hasNextSong = useMemo(() => {
    if (mediaType === 'song') {
      return isShuffleActive || currentSongIndex + 1 < currentSongList.length
    } else {
      return currentSongIndex + 1 < radioList.length
    }
  }, [isShuffleActive, currentSongIndex, currentSongList.length, mediaType])

  const hasPrevSong = useMemo(() => {
    return currentSongIndex > 0
  }, [currentSongIndex])

  const isPlayingOneSong = useMemo(() => {
    return currentSongList.length === 1
  }, [currentSongList.length])

  const playNextSong = useCallback(() => {
    if (hasNextSong) {
      setCurrentSongIndex(prevIndex => prevIndex + 1)
    }
  }, [hasNextSong])

  const playPrevSong = useCallback(() => {
    if (hasPrevSong) {
      setCurrentSongIndex(prevIndex => prevIndex - 1)
    }
  }, [hasPrevSong])

  useEffect(() => {
    manageMediaSession.setHandlers({
      togglePlayPause,
      playPrev: playPrevSong,
      playNext: playNextSong
    })
  }, [playPrevSong, playNextSong, togglePlayPause])

  const setPlayingState = useCallback((state: boolean) => {
    setIsPlaying(state)
  }, [])

  const getCurrentSong = useCallback(() => {
    return currentSongList[currentSongIndex]
  }, [currentSongList, currentSongIndex])

  const checkActiveSong = useCallback((id: string) => {
    return id === getCurrentSong()?.id
  }, [getCurrentSong])

  const setPlayRadio = useCallback((list: Radio[], index: number) => {
    if (
      mediaType === 'radio' &&
      radioList.length > 0 &&
      list[index].id === radioList[currentSongIndex].id
    ) {
      setIsPlaying(true)
      return
    }

    clearPlayerState()
    setMediaType('radio')
    setRadioList(list)
    setCurrentSongIndex(index)
    setIsPlaying(true)
  }, [])

  const value: IPlayerContext = {
    shuffledSongList,
    currentSongList,
    currentSongIndex,
    originalSongIndex,
    isPlaying,
    isLoopActive,
    isShuffleActive,
    isPlayingOneSong,
    isSongStarred,
    setIsSongStarred,
    playSong,
    setPlayingState,
    setSongList,
    togglePlayPause,
    toggleLoop,
    toggleShuffle,
    checkActiveSong,
    playNextSong,
    playPrevSong,
    clearPlayerState,
    hasNextSong,
    hasPrevSong,
    progress,
    setProgress,
    currentDuration,
    setCurrentDuration,
    getCurrentSong,
    mediaType,
    radioList,
    setPlayRadio
  }

  return (
    <PlayerContext.Provider value={value}>
      {children}
    </PlayerContext.Provider>
  )
}

export function usePlayer() {
  return useContext(PlayerContext)
}
