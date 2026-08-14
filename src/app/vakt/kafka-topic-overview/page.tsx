import { Skeleton } from '@navikt/ds-react'
import React, { ReactElement, Suspense } from 'react'
import * as R from 'remeda'

import { KafkaTopicsList } from '#features/vakt/kafka/topic-overview/KafkaTopicsList'
import { NamespacePicker, ValidNamespaces } from '#features/vakt/kafka/topic-overview/NamespacePicker'
import { produksjonsFeatures } from '#features/vakt/produksjons-feature-list'
import VaktFeaturePage from '#features/vakt/shared/VaktFeaturePage'

async function Page({ searchParams }: PageProps<'/vakt/kafka-topic-overview'>): Promise<ReactElement> {
    const { namespace: namespaceQuery } = await searchParams
    const selectedNamespace = (typeof namespaceQuery === 'string' ? namespaceQuery : 'tsm') as ValidNamespaces

    return (
        <VaktFeaturePage feature={produksjonsFeatures.technical.kafkaTopicOverview}>
            <NamespacePicker />
            {selectedNamespace != null ? (
                <Suspense
                    key={selectedNamespace}
                    fallback={
                        <div>
                            <Skeleton width={180} height={32} />
                            <Skeleton width={140} height={22} />
                            {R.range(0, 5).map((it) => (
                                <div key={it}>
                                    <Skeleton width={120} height={24} />
                                    <Skeleton variant="rectangle" height={240} />
                                </div>
                            ))}
                        </div>
                    }
                >
                    <KafkaTopicsList namespace={selectedNamespace} />
                </Suspense>
            ) : (
                <div>No namespace selected</div>
            )}
        </VaktFeaturePage>
    )
}

export default Page
