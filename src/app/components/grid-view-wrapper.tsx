import { useGrid, useVirtualizer } from '@virtual-grid/react'
import {
  Fragment,
  ReactNode,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { getMainScrollElement } from '@/utils/scrollPageToTop'

type GridViewWrapperProps<T> = {
  list: T[]
  children: (child: T) => ReactNode
  titleHeight?: number
  gap?: number
  padding?: number
  defaultWidth?: number
}

export function GridViewWrapper<T>({
  list,
  children,
  titleHeight = 40,
  gap = 16,
  padding = 32,
  defaultWidth = 181,
}: GridViewWrapperProps<T>) {
  const scrollDivRef = useRef<HTMLDivElement | null>(null)
  const [gridColumnsSize, setGridColumnsSize] = useState(4)
  const [size, setSize] = useState({
    width: defaultWidth,
    height: defaultWidth + titleHeight,
  })

  const rows = useMemo(
    () => Math.ceil(list.length / gridColumnsSize),
    [gridColumnsSize, list.length],
  )

  const calculateSize = useCallback(() => {
    if (!scrollDivRef.current) {
      return {
        width: defaultWidth,
        height: defaultWidth + titleHeight,
      }
    }

    const pageWidth = scrollDivRef.current.offsetWidth
    const gapsDifference = (gridColumnsSize - 1) * gap
    const bothSidesPaddingSize = padding * 2
    const remainSpace = pageWidth - bothSidesPaddingSize - gapsDifference

    const width = remainSpace / gridColumnsSize
    const height = width + titleHeight

    return {
      width,
      height,
    }
  }, [defaultWidth, gap, gridColumnsSize, padding, titleHeight])

  useLayoutEffect(() => {
    scrollDivRef.current = getMainScrollElement()

    const handleResize = () => {
      const width = window.innerWidth

      if (width >= 1536) {
        setGridColumnsSize(8) // 2xl breakpoint
      } else if (width >= 1024) {
        setGridColumnsSize(6) // lg breakpoint
      } else {
        setGridColumnsSize(4) // default size
      }

      const newSize = calculateSize()
      setSize(newSize)
    }

    let animationFrameId: number

    const resizeHandler = () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId)
      }
      animationFrameId = requestAnimationFrame(handleResize)
    }

    handleResize()
    window.addEventListener('resize', resizeHandler)

    return () => {
      window.removeEventListener('resize', resizeHandler)
      cancelAnimationFrame(animationFrameId)
    }
  }, [calculateSize])

  const grid = useGrid({
    scrollRef: scrollDivRef,
    count: list.length,
    totalCount: list.length,
    columns: gridColumnsSize,
    rows,
    size,
    padding: {
      x: padding,
    },
    gap,
    overscan: 5,
  })

  const rowVirtualizer = useVirtualizer(grid.rowVirtualizer)
  const columnVirtualizer = useVirtualizer(grid.columnVirtualizer)

  useEffect(() => {
    rowVirtualizer.measure()
  }, [rowVirtualizer, grid.virtualItemHeight])

  useEffect(() => {
    columnVirtualizer.measure()
  }, [columnVirtualizer, grid.virtualItemWidth])

  return (
    <div
      style={{
        width: columnVirtualizer.getTotalSize(),
        height: rowVirtualizer.getTotalSize(),
        position: 'relative',
      }}
    >
      {rowVirtualizer.getVirtualItems().map((virtualRow) => (
        <Fragment key={virtualRow.key}>
          {columnVirtualizer.getVirtualItems().map((virtualColumn) => {
            const item = grid.getVirtualItem({
              row: virtualRow,
              column: virtualColumn,
            })

            if (!item) return null

            const child = list[item.index]

            return (
              <div key={virtualColumn.key} style={item.style}>
                {children(child)}
              </div>
            )
          })}
        </Fragment>
      ))}
    </div>
  )
}
