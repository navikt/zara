import React, { ReactElement } from 'react'

import { MultilineUserFeedback } from '@components/feedback/MultilineUserFeedback'

type Props = {
    message: string
}

function UserFeedback({ message }: Props): ReactElement {
    return (
        <div className="bg-ax-bg-raised border border-ax-border-neutral-subtle max-w-prose p-3 rounded-md">
            <MultilineUserFeedback message={message} />
        </div>
    )
}

export default UserFeedback
