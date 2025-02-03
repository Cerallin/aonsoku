import { useInfiniteQuery, useQuery } from '@tanstack/react-query'
import { useVirtualizer } from '@tanstack/react-virtual'
import debounce from 'lodash/debounce'
import { memo, useEffect, useRef } from 'react'
import { useParams } from 'react-router-dom'
import { AlbumFallback } from '@/app/components/fallbacks/album-fallbacks'
import ListWrapper from '@/app/components/list-wrapper'
import { EpisodeCard } from '@/app/components/podcasts/episode-card'
import { EpisodesFilters } from '@/app/components/podcasts/episodes-filters'
import { PodcastInfo } from '@/app/components/podcasts/podcast-info'
import ErrorPage from '@/app/pages/error-page'
import { getPodcast, getPodcastEpisodes } from '@/queries/podcasts'

const MemoPodcastInfo = memo(PodcastInfo)

export default function Podcast() {
  const defaultPerPage = 20
  const { podcastId } = useParams() as { podcastId: string }
  const scrollDivRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    scrollDivRef.current = document.querySelector(
      '#main-scroll-area #scroll-viewport',
    ) as HTMLDivElement
  }, [])

  const {
    data: podcast,
    isFetched,
    isLoading: podcastIsLoading,
  } = useQuery({
    queryKey: ['get-podcast', podcastId],
    queryFn: () => getPodcast(podcastId),
  })

  const fetchEpisodes = async ({ pageParam = 1 }) => {
    return getPodcastEpisodes(podcastId, {
      order_by: 'published_at',
      sort: 'desc',
      page: pageParam,
      per_page: defaultPerPage,
    })
  }

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isLoading: episodesIsLoading,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ['get-podcast-episodes', podcastId],
    queryFn: fetchEpisodes,
    initialPageParam: 1,
    getNextPageParam: (lastPage) => lastPage.nextOffset,
  })

  const episodes = data?.pages.flatMap((page) => page.episodes) || []

  const virtualizer = useVirtualizer({
    count: episodes.length,
    getScrollElement: () => scrollDivRef.current,
    estimateSize: () => 124,
    overscan: 5,
  })

  useEffect(() => {
    const handleScroll = debounce(() => {
      if (!scrollDivRef.current) return

      const { scrollTop, clientHeight, scrollHeight } = scrollDivRef.current

      const isNearBottom =
        scrollTop + clientHeight >= scrollHeight - scrollHeight / 4

      if (isNearBottom && hasNextPage && !isFetchingNextPage) {
        fetchNextPage()
      }
    }, 200)

    const scrollElement = scrollDivRef.current
    scrollElement?.addEventListener('scroll', handleScroll)
    return () => {
      scrollElement?.removeEventListener('scroll', handleScroll)
    }
  }, [fetchNextPage, hasNextPage, isFetchingNextPage])

  if (episodesIsLoading || podcastIsLoading) return <AlbumFallback />
  if (isFetched && !podcast) {
    return <ErrorPage status={404} statusText="Not Found" />
  }
  if (!podcast) return <AlbumFallback />
  if (!data) return <AlbumFallback />

  const items = virtualizer.getVirtualItems()

  return (
    <div className="h-full">
      <MemoPodcastInfo podcast={podcast} />
      <EpisodesFilters />

      <ListWrapper className="px-4">
        <div
          style={{
            height: virtualizer.getTotalSize(),
            position: 'relative',
          }}
        >
          {items.map((virtualRow) => {
            const episode = episodes[virtualRow.index]

            return (
              <EpisodeCard
                episode={episode}
                key={virtualRow.index}
                style={{
                  position: 'absolute',
                  top: virtualRow.start,
                  width: '100%',
                }}
              />
            )
          })}
        </div>
      </ListWrapper>
    </div>
  )
}
