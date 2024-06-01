import { subsonic } from '@/service/subsonic'
import { LoaderFunctionArgs, defer } from 'react-router-dom'

export async function singleArtistLoader({ params }: LoaderFunctionArgs<any>) {
  const { artistId } = params

  if (artistId) {
    const artist = await subsonic.artists.getOne(artistId)
    const artistInfoPromise = subsonic.artists.getInfo(artistId)
    const topSongsPromise = subsonic.songs.getTopSongs(artist?.name || '')

    return defer({
      artist,
      artistInfo: artistInfoPromise,
      topSongs: topSongsPromise
    })
  }
}