import { useTranslation } from 'react-i18next'
import {
  Content,
  ContentItem,
  ContentItemForm,
  ContentItemTitle,
  ContentSeparator,
  Header,
  HeaderTitle,
  HeaderDescription,
  Root,
} from '@/app/components/settings/section'
import { Switch } from '@/app/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/app/components/ui/select'
import { usePrivacySettings } from '@/store/player.store'
import { LyricProviderList } from '@/types/playerContext'

export function Services() {
  const { t } = useTranslation()
  const { lyricSearchEnabled, setLyricSearchEnabled } = usePrivacySettings()
  const { lyricProvider: lyricProvider, setLyricProvider: setLyricProvider } = usePrivacySettings()

  return (
    <Root>
      <Header>
        <HeaderTitle>{t('settings.privacy.services.group')}</HeaderTitle>
        <HeaderDescription>
          {t('settings.privacy.services.description')}
        </HeaderDescription>
      </Header>
      <Content>
        <ContentItem>
          <ContentItemTitle info={t('settings.privacy.services.searchLyric.info')}>
            {t('settings.privacy.services.searchLyric.label')}
          </ContentItemTitle>
          <ContentItemForm>
            <Switch
              checked={lyricSearchEnabled}
              onCheckedChange={setLyricSearchEnabled}
            />
          </ContentItemForm>
        </ContentItem>
      </Content>

      <Content>
        <ContentItem>
          <ContentItemTitle info={t('settings.privacy.services.lyricProviders.info')}>
            {t('settings.privacy.services.lyricProviders.label')}
          </ContentItemTitle>
          <ContentItemForm>
            <Select value={lyricProvider} onValueChange={setLyricProvider}>
              <SelectTrigger className="h-8 ring-offset-transparent focus:ring-0 focus:ring-transparent text-left">
                <SelectValue>
                  {lyricProvider}
                </SelectValue>
              </SelectTrigger>
              <SelectContent align="end">
                <SelectGroup>
                  {LyricProviderList.map((provider) => (
                    <SelectItem key={provider} value={provider}>
                      <span className="text-sm text-foreground">
                        {provider}
                      </span>
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </ContentItemForm>
        </ContentItem>
      </Content>
      <ContentSeparator />
    </Root>
  )
}
