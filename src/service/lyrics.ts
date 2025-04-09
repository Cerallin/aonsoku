import { httpClient } from '@/api/httpClient'
import { usePlayerStore } from '@/store/player.store'
import { LyricsResponse } from '@/types/responses/song'
import { lrclibClient } from '@/utils/appName'
import { checkServerType } from '@/utils/servers'
import { invoke } from '@tauri-apps/api/core';

interface GetLyricsData {
  artist: string
  title: string
  album?: string
  duration?: number
}

interface LRCLibResponse {
  id: number
  trackName: string
  artistName: string
  plainLyrics: string
  syncedLyrics: string
}
interface NeteaseArtist {
  id: number;
  name: string;
  trans: string | null;
}

interface NeteaseAlbum {
  id: number;
  name: string;
  artist: NeteaseArtist;
  publishTime: number;
  size: number;
  status: number;
}

interface NeteaseSong {
  id: number;
  name: string;
  artists: NeteaseArtist[];
  album: NeteaseAlbum;
  duration: number;
  status: number;
  fee: number;
}


interface NeteaseQueryResult {
  songCount: number
  hasMore: boolean
  songs: NeteaseSong[]
}

interface NeteaseQueryResponse {
  code: number
  result: NeteaseQueryResult
}

interface NeteaseLyricResponse {
  code: number
  lrc: {
    version: number
    lyric: string
  }
  tlyric: {
    version: number
    lyric: string
  }
}

async function getLyrics(getLyricsData: GetLyricsData) {
  const { preferSyncedLyrics } = usePlayerStore.getState().settings.lyrics

  // If the user prefers synced lyrics, attempt to fetch them from the LrcLib first.
  // If lyrics are found, return them immediately.
  // If not, proceed with the default flow.
  if (preferSyncedLyrics) {
    const lyrics = await getLyricsFromWeb(getLyricsData)

    if (lyrics.value !== '') return lyrics
  }

  const response = await httpClient<LyricsResponse>('/getLyrics', {
    method: 'GET',
    query: {
      artist: getLyricsData.artist,
      title: getLyricsData.title,
    },
  })

  const lyricNotFound =
    !response || !response?.data.lyrics || !response.data.lyrics.value

  // If the Subsonic API did not return lyrics and the user does not prefer synced lyrics,
  // fallback to fetching lyrics from the LrcLib.
  // Note: If `preferSyncedLyrics` is true and we reached this point, it means the LrcLib
  // does not contains lyrics for the track, so the fallback is unnecessary in that case.
  if (lyricNotFound && !preferSyncedLyrics) {
    return getLyricsFromWeb(getLyricsData)
  }

  return response?.data.lyrics
}

async function getLyricsFromWeb(getLyricsData: GetLyricsData) {
  const { lyricSearchEnabled, lyricProvider } = usePlayerStore.getState().settings.privacy

  const { isLms } = checkServerType()
  const { title } = getLyricsData

  // LMS server tends to join all artists into a single string
  // Ex: "Cartoon, Jeja, Daniel Levi, Time To Talk"
  // To LRCLIB work correctly, we have to send only one
  const artist = isLms
    ? getLyricsData.artist.split(',')[0]
    : getLyricsData.artist

  if (!lyricSearchEnabled) {
    return {
      artist,
      title,
      value: '',
    }
  }

  if (lyricProvider == "lrclib") {
    return await getLyricsFromLRCLib(artist, title)
  } else if (lyricProvider == "netease") {
    return await getLyricsFromNeteaseMusic(artist, title)
  } else {
    return {
      artist,
      title,
      value: '',
    }
  }
}

async function getLyricsFromLRCLib(artist: string, title: string) {
  try {
    const params = new URLSearchParams({
      artist_name: artist,
      track_name: title,
    })

    const url = new URL('https://lrclib.net/api/get')
    url.search = params.toString()

    const request = await fetch(url.toString(), {
      headers: {
        'Lrclib-Client': lrclibClient,
      },
    })
    const response: LRCLibResponse = await request.json()

    if (response) {
      const { syncedLyrics, plainLyrics } = response

      let finalLyric = ''

      if (syncedLyrics) {
        finalLyric = syncedLyrics
      } else if (plainLyrics) {
        finalLyric = plainLyrics
      }

      return {
        artist,
        title,
        value: formatLyrics(finalLyric),
      }
    }
  } catch { }

  return {
    artist,
    title,
    value: '',
  }
}

/**
 * Netease Music Lyrics with Chinese Translation
 * Original Author: btx258 Elia Konata09
 * Modified by: Cerallin
 * License: GNU GPLv3
 * Link: https://github.com/Konata09/ESLyric_netease
 */
async function getLyricsFromNeteaseMusic(artist: string, title: string) {
  try {
    // TODO First search with "title + artist"
    console.log("getLyricsFromNeteaseMusic")
    const res = await invoke('search_songs', { searchString: `${title} + ${artist}` })
    console.log("netease_search_songs")
    console.log(res)
    const response = JSON.parse(res as string) as NeteaseQueryResponse
    if (response.code != 200) {
      throw Error("Failed on query songs with Netease API.")
    }

    // TODO Search lyrics by song ID
    const songs = response.result.songs
    for (const song of songs) {
      const res = await invoke('fetch_lyrics', { songId: song.id });
      const response = JSON.parse(res as string) as NeteaseLyricResponse

      if (response.code != 200) {
        // Probably other requests won't success either.
        throw new Error("Failed to get lyric response.")
      }

      const lyric = response.lrc.lyric
      if (!lyric) { // Check another song if lyric is empty
        continue
      }

      // Or return 
      return {
        artist: artist,
        title: title,
        value: lyric,
      }
    }
    // Fallback to empty
    return {
      artist: artist,
      title: title,
      value: '',
    }
  } catch {
    return {
      artist: artist,
      title: title,
      value: '',
    }
  }
}

function formatLyrics(lyrics: string) {
  return lyrics.trim().replaceAll('\r\n', '\n')
}

export const lyrics = {
  getLyrics,
  getLyricsFromWeb,
}
