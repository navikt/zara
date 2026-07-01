import { Heading, Skeleton } from '@navikt/ds-react'
import React, { ReactElement, Suspense } from 'react'

import KafkaConsumerGroupForm from '#features/vakt/kafka/KafkaConsumerGroupForm'
import KafkaConsumerGroupSearchInfo from '#features/vakt/kafka/KafkaConsumerGroupSearchInfo'
import { produksjonsFeatures } from '#features/vakt/produksjons-feature-list'
import VaktFeaturePage from '#features/vakt/shared/VaktFeaturePage'

async function Page({ searchParams }: PageProps<'/vakt/kafka'>): Promise<ReactElement> {
    const { group } = await searchParams
    const groupId = typeof group === 'string' ? group.trim() : ''

    return (
        <VaktFeaturePage feature={produksjonsFeatures.kafkaConsumerGroups}>
            <KafkaConsumerGroupForm />
            {groupId.length > 0 && (
                <Suspense
                    key={groupId}
                    fallback={
                        <div className="max-w-prose mt-4">
                            <Heading size="small" level="4">
                                Consumer group
                            </Heading>
                            <Skeleton variant="rounded" width="100%" height={300} />
                        </div>
                    }
                >
                    <KafkaConsumerGroupSearchInfo groupId={groupId} />
                </Suspense>
            )}
        </VaktFeaturePage>
    )
}

export default Page
