import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'

import { Button } from '@/components/ui/button'
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from '@/components/ui/form'

import { Input } from '@/components/ui/input'
import { SelectDropdown } from '@/components/select-dropdown'
import { useOnboardingStore } from '@/stores/onboarding-store'

// --------------------
// Schema (FIXED FOR VERCEL)
// --------------------
const schema = z.object({
  displayName: z.string().min(1, 'Required'),
  experience: z.enum(['beginner', 'intermediate', 'advanced', 'pro']),
  preferredPair: z.string().min(1, 'Required'),
  startingCapital: z.coerce.number().min(1, 'Required'),
})

type FormData = z.infer<typeof schema>

// --------------------
// Component
// --------------------
export default function Onboarding() {
  const setProfile = useOnboardingStore((s) => s.setProfile)

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      displayName: '',
      experience: 'beginner',
      preferredPair: '',
      startingCapital: 0,
    },
  })

  const onSubmit = (data: FormData) => {
    console.log('SUBMIT:', data)
    setProfile(data)
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-lg space-y-6">

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">

            {/* Display Name */}
            <FormField
              control={form.control}
              name="displayName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Display Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter your name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Experience */}
            <FormField
              control={form.control}
              name="experience"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Experience</FormLabel>
                  <FormControl>
                    <SelectDropdown
                      value={field.value}
                      onValueChange={(val: string) => field.onChange(val)}
                      items={[
                        { label: 'Beginner', value: 'beginner' },
                        { label: 'Intermediate', value: 'intermediate' },
                        { label: 'Advanced', value: 'advanced' },
                        { label: 'Pro', value: 'pro' },
                      ]}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Preferred Pair */}
            <FormField
              control={form.control}
              name="preferredPair"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Preferred Pair</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. EURUSD" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Starting Capital */}
            <FormField
              control={form.control}
              name="startingCapital"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Starting Capital</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      value={field.value}
                      onChange={(e) =>
                        field.onChange(e.target.valueAsNumber || 0)
                      }
                      placeholder="1000"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Submit */}
            <Button type="submit" className="w-full">
              Continue
            </Button>

          </form>
        </Form>

      </div>
    </div>
  )
}
