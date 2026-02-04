import React, { ReactElement } from 'react'

import { MultilineUserFeedback } from '@components/feedback/MultilineUserFeedback'

type Props = {
    message: string
}

function UserFeedback({ message }: Props): ReactElement {
    return (
        <div className="bg-ax-bg-sunken border border-ax-border-neutral-subtle p-3 rounded-md">
            <MultilineUserFeedback message={message} />
        </div>
    )
}

export default UserFeedback
