import { Heading, Skeleton } from '@navikt/ds-react'
import React, { ReactElement, Suspense } from 'react'

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
                        <div className="max-w-prose mt-4">
                            <Heading size="small" level="4">
                                Kafka topics in namespace: {selectedNamespace}
                            </Heading>
                            <Skeleton variant="rounded" width="100%" height={300} />
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
