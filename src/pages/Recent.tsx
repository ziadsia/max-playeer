import LibGrid from '../components/LibGrid';
import { Empty, PageHeader } from '../components/ui';
import { useHistory } from '../hooks/useLibrary';
import { useI18n } from '../i18n';

export default function Recent() {
  const { t } = useI18n();
  const hist = useHistory();
  return (
    <div>
      <PageHeader title={t('recent')}>
        {hist.items.length > 0 && <button className="btn-ghost" onClick={hist.clear}>{t('clearHistory')}</button>}
      </PageHeader>
      {hist.items.length ? <LibGrid items={hist.items} /> : <Empty text={t('empty')} />}
    </div>
  );
}
