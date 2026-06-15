import { TextInput, type TextInputProps, type StyleProp, type TextStyle } from 'react-native'

import { colors } from '@/theme/colors'

type EmployeeNumberInputProps = Omit<TextInputProps, 'style'> & {
  disabled?: boolean
  style?: StyleProp<TextStyle>
}

export function EmployeeNumberInput({ disabled = false, style, ...props }: EmployeeNumberInputProps) {
  return (
    <TextInput
      editable={!disabled}
      placeholderTextColor={colors.placeholder}
      autoCapitalize="characters"
      autoCorrect={false}
      className="flex-1 min-h-[58px] rounded-[10px] border border-border px-[18px] text-[17px] font-semibold text-textPrimary"
      style={[
        { backgroundColor: disabled ? colors.surfaceTertiary : colors.surfaceCanvas },
        style,
      ]}
      {...props}
    />
  )
}
