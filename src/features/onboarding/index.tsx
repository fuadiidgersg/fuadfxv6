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
// Schema
// --------------------
const schema = z.object({
  displayName: z.string().min(1, 'Required'),
  experience: z.enum(['beginner', 'intermediate', 'advanced', 'pro']),
  preferredPair: z.string().min(1, 'Required'),
  startingCapital: z.number().min(1, 'Required'),
})

type FormData = z.infer<typeof schema>

// --------------------
// FIX: Strongly typed resolver
// --------------------
const resolver = zodResolver(schema)

export default function Onboarding() {
  const setProfile = useOnboardingStore((s) => s.setProfile)

  // --------------------
  // FIX: Explicit generic lock (removes TFieldValues conflict)
  // --------------------
  const form = useForm<FormData>({
    resolver,
    defaultValues: {
      displayName: '',
      experience: 'beginner',
      preferredPair: '',
      startingCapital: 0,
    },
  })

  const onSubmit = (data: FormData) => {
    setProfile(data)
  }

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          
          {/* Display Name */}
          <FormField
            control={form.control}
            name="displayName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Display Name</FormLabel>
                <FormControl>
                  <Input {...field} />
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
                <SelectDropdown
                  defaultValue={field.value}
                  onValueChange={field.onChange}
                  items={[
                    { label: 'Beginner', value: 'beginner' },
                    { label: 'Intermediate', value: 'intermediate' },
                    { label: 'Advanced', value: 'advanced' },
                    { label: 'Pro', value: 'pro' },
                  ]}
                />
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Pair */}
          <FormField
            control={form.control}
            name="preferredPair"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Preferred Pair</FormLabel>
                <Input {...field} />
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Capital */}
          <FormField
            control={form.control}
            name="startingCapital"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Starting Capital</FormLabel>
                <Input
                  type="number"
                  value={field.value}
                  onChange={(e) => field.onChange(Number(e.target.value))}
                />
                <FormMessage />
              </FormItem>
            )}
          />

          <Button type="submit" className="w-full">
            Continue
          </Button>
        </form>
      </Form>
    </div>
  )
}
