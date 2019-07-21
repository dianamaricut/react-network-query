import { useContext, ReactElement, useState } from 'react'

import { NetworkQueryContext } from './Provider'
import { buildUrl, interpolateString, isObjectEmpty } from './utils'

interface Variables {
  [key: string]: string | number
}

type Method = 'POST' | 'PUT' | 'DELETE' | 'PATCH'

interface Common {
  endpoint?: string
  variables?: Variables
  fetchOptions?: { [key: string]: string | number | object }
  method?: Method
  body?: { [key: string]: any }
}

interface ChildrenArg {
  update: (arg0: Common) => Promise<any>
  isMutating: boolean
  error: Error
}

interface Props extends Common {
  children: ({ update, isMutating, error }: ChildrenArg) => ReactElement
  refetch?: boolean | string[]
  onComplete?: (arg0?: any) => void
}

const Mutation = ({
  children,
  endpoint,
  body,
  variables,
  fetchOptions,
  method = 'POST',
  refetch = false,
  onComplete,
}: Props) => {
  const { requester, url, updateKey } = useContext(NetworkQueryContext)
  const [isMutating, setIsMutating] = useState(false)
  const [error, setError] = useState()

  const update = async ({
    endpoint: endpointInline,
    body: bodyInline,
    method: methodInline,
    variables: variablesInline,
    fetchOptions: fetchOptionsInline,
  }: Common) => {
    setIsMutating(true)

    try {
      const interpolatedEndpoint =
        (variablesInline || variables) &&
        !isObjectEmpty(variablesInline || variables)
          ? interpolateString(
              endpointInline || endpoint || '',
              variablesInline || variables || {},
            )
          : endpointInline || endpoint || ''
      const builtUrl = buildUrl(interpolatedEndpoint, url)

      const response = await requester(builtUrl, {
        data: bodyInline || body,
        method: methodInline || method,
        ...fetchOptions,
        ...fetchOptionsInline,
      })

      if (
        (refetch === true || Array.isArray(refetch)) &&
        typeof updateKey === 'function'
      ) {
        updateKey(Array.isArray(refetch) ? refetch : undefined)
      }

      if (typeof onComplete === 'function') {
        onComplete(response)
      }

      return response
    } catch (err) {
      setError(err)
    } finally {
      if (typeof onComplete === 'function') {
        onComplete()
      }

      setIsMutating(false)
    }
  }

  return children({ update, isMutating, error })
}

export default Mutation
