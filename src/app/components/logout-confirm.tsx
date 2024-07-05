import { MouseEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/app/components/ui/alert-dialog'
import { ROUTES } from '@/routes/routesList'
import { useAppActions } from '@/store/app.store'
import { usePlayerActions } from '@/store/player.store'
import { usePlaylists } from '@/store/playlists.store'
import { useRadios } from '@/store/radios.store'

interface AlertDialogProps {
  openDialog: boolean
  setOpenDialog: (value: boolean) => void
}

export function LogoutConfirmDialog({
  openDialog,
  setOpenDialog,
}: AlertDialogProps) {
  const { removeConfig } = useAppActions()
  const navigate = useNavigate()
  const { clearPlayerState } = usePlayerActions()
  const { setRadios } = useRadios()
  const { clearPlaylists } = usePlaylists()
  const { t } = useTranslation()

  function handleRemoveConfig(e: MouseEvent<HTMLButtonElement>) {
    e.preventDefault()
    removeConfig()
    setRadios([])
    clearPlaylists()
    clearPlayerState()
    navigate(ROUTES.SERVER_CONFIG, { replace: true })
  }

  return (
    <AlertDialog open={openDialog}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t('logout.dialog.title')}</AlertDialogTitle>
          <AlertDialogDescription>
            {t('logout.dialog.description')}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={() => setOpenDialog(!openDialog)}>
            {t('logout.dialog.cancel')}
          </AlertDialogCancel>
          <AlertDialogAction onClick={handleRemoveConfig}>
            {t('logout.dialog.confirm')}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
