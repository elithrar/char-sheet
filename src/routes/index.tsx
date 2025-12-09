import { useState, useMemo } from 'react'
import { createFileRoute } from '@tanstack/react-router'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Separator } from '@/components/ui/separator'
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select'

import racesData from '@/data/races.json'

export const Route = createFileRoute('/')({ component: CharacterSheet })

const CLASSES = [
	{ id: 'barbarian', name: 'Barbarian', hitDie: 12 },
	{ id: 'bard', name: 'Bard', hitDie: 8 },
	{ id: 'cleric', name: 'Cleric', hitDie: 8 },
	{ id: 'druid', name: 'Druid', hitDie: 8 },
	{ id: 'fighter', name: 'Fighter', hitDie: 10 },
	{ id: 'monk', name: 'Monk', hitDie: 8 },
	{ id: 'paladin', name: 'Paladin', hitDie: 10 },
	{ id: 'ranger', name: 'Ranger', hitDie: 10 },
	{ id: 'rogue', name: 'Rogue', hitDie: 8 },
	{ id: 'sorcerer', name: 'Sorcerer', hitDie: 6 },
	{ id: 'warlock', name: 'Warlock', hitDie: 8 },
	{ id: 'wizard', name: 'Wizard', hitDie: 6 },
]

const ATTRIBUTES = [
	{ key: 'str', name: 'STR', fullName: 'Strength' },
	{ key: 'dex', name: 'DEX', fullName: 'Dexterity' },
	{ key: 'con', name: 'CON', fullName: 'Constitution' },
	{ key: 'int', name: 'INT', fullName: 'Intelligence' },
	{ key: 'wis', name: 'WIS', fullName: 'Wisdom' },
	{ key: 'cha', name: 'CHA', fullName: 'Charisma' },
]

const SKILLS = [
	{ name: 'Acrobatics', attr: 'dex' },
	{ name: 'Animal Handling', attr: 'wis' },
	{ name: 'Arcana', attr: 'int' },
	{ name: 'Athletics', attr: 'str' },
	{ name: 'Deception', attr: 'cha' },
	{ name: 'History', attr: 'int' },
	{ name: 'Insight', attr: 'wis' },
	{ name: 'Intimidation', attr: 'cha' },
	{ name: 'Investigation', attr: 'int' },
	{ name: 'Medicine', attr: 'wis' },
	{ name: 'Nature', attr: 'int' },
	{ name: 'Perception', attr: 'wis' },
	{ name: 'Performance', attr: 'cha' },
	{ name: 'Persuasion', attr: 'cha' },
	{ name: 'Religion', attr: 'int' },
	{ name: 'Sleight of Hand', attr: 'dex' },
	{ name: 'Stealth', attr: 'dex' },
	{ name: 'Survival', attr: 'wis' },
]

type Race = (typeof racesData.races)[number]
type Attributes = Record<string, number>
type SkillProficiency = 'none' | 'proficient' | 'expertise'
type SkillProficiencies = Record<string, SkillProficiency>
type SaveProficiencies = Record<string, boolean>
type Weapon = { name: string; attackBonus: string; damage: string; type: string }
type Feat = { name: string; description: string }

// 5e Point Buy costs: 8=0, 9=1, 10=2, 11=3, 12=4, 13=5, 14=7, 15=9
const POINT_BUY_COSTS: Record<number, number> = {
	8: 0,
	9: 1,
	10: 2,
	11: 3,
	12: 4,
	13: 5,
	14: 7,
	15: 9,
}

const POINT_BUY_TOTAL = 27
const POINT_BUY_MIN = 8
const POINT_BUY_MAX = 15

function getPointCost(score: number): number {
	if (score < POINT_BUY_MIN) return 0
	if (score > POINT_BUY_MAX) return POINT_BUY_COSTS[POINT_BUY_MAX] + (score - POINT_BUY_MAX) * 2
	return POINT_BUY_COSTS[score] ?? 0
}

function calculateTotalPoints(attrs: Attributes): number {
	return Object.values(attrs).reduce((sum, score) => sum + getPointCost(score), 0)
}

function generateRandomPointBuy(): Attributes {
	const attrs: Attributes = { str: 8, dex: 8, con: 8, int: 8, wis: 8, cha: 8 }
	const keys = Object.keys(attrs)
	let pointsRemaining = POINT_BUY_TOTAL

	// Shuffle the order we assign points
	const shuffledKeys = [...keys].sort(() => Math.random() - 0.5)

	// Keep assigning points randomly until we can't anymore
	let attempts = 0
	while (pointsRemaining > 0 && attempts < 1000) {
		attempts++
		const key = shuffledKeys[Math.floor(Math.random() * shuffledKeys.length)]
		const currentScore = attrs[key]

		if (currentScore >= POINT_BUY_MAX) continue

		const nextScore = currentScore + 1
		const costDiff = getPointCost(nextScore) - getPointCost(currentScore)

		if (costDiff <= pointsRemaining) {
			attrs[key] = nextScore
			pointsRemaining -= costDiff
		}
	}

	return attrs
}

function calculateModifier(score: number): number {
	return Math.floor((score - 10) / 2)
}

function formatModifier(mod: number): string {
	return mod >= 0 ? `+${mod}` : `${mod}`
}

function CharacterSheet() {
	const [characterName, setCharacterName] = useState('')
	const [characterClass, setCharacterClass] = useState('')
	const [level, setLevel] = useState(1)
	const [selectedRaceId, setSelectedRaceId] = useState('')
	const [background, setBackground] = useState('')
	const [inspiration, setInspiration] = useState(false)

	// Base attributes (before racial bonuses) - start with point buy default (all 8s = 0 points)
	const [baseAttributes, setBaseAttributes] = useState<Attributes>({
		str: 8,
		dex: 8,
		con: 8,
		int: 8,
		wis: 8,
		cha: 8,
	})

	// Point buy calculation
	const pointsUsed = useMemo(() => calculateTotalPoints(baseAttributes), [baseAttributes])

	const [saveProficiencies, setSaveProficiencies] = useState<SaveProficiencies>({})
	const [skillProficiencies, setSkillProficiencies] = useState<SkillProficiencies>({})

	const [armorClass, setArmorClass] = useState(10)
	const [initiativeBonus, setInitiativeBonus] = useState(0)
	const [hitPointMax, setHitPointMax] = useState(10)
	const [currentHitPoints, setCurrentHitPoints] = useState(10)
	const [tempHitPoints, setTempHitPoints] = useState(0)
	const [hitDiceUsed, setHitDiceUsed] = useState(0)

	const [deathSaveSuccesses, setDeathSaveSuccesses] = useState([false, false, false])
	const [deathSaveFailures, setDeathSaveFailures] = useState([false, false, false])

	const [weapons, setWeapons] = useState<Weapon[]>([
		{ name: '', attackBonus: '', damage: '', type: '' },
		{ name: '', attackBonus: '', damage: '', type: '' },
		{ name: '', attackBonus: '', damage: '', type: '' },
	])

	const [feats, setFeats] = useState<Feat[]>([
		{ name: '', description: '' },
		{ name: '', description: '' },
		{ name: '', description: '' },
	])

	// Get selected race data
	const selectedRace = useMemo(() => {
		return racesData.races.find((r) => r.id === selectedRaceId) as Race | undefined
	}, [selectedRaceId])

	// Calculate attributes with racial bonuses
	const attributes = useMemo(() => {
		const result = { ...baseAttributes }
		if (selectedRace?.attributeBonuses) {
			const bonuses = selectedRace.attributeBonuses as unknown as Record<string, number>
			for (const [attr, bonus] of Object.entries(bonuses)) {
				if (attr in result && typeof bonus === 'number') {
					result[attr] += bonus
				}
			}
		}
		return result
	}, [baseAttributes, selectedRace])

	// Get racial skill proficiencies
	const racialSkillProficiencies = useMemo(() => {
		if (!selectedRace?.skillProficiencies) return []
		return selectedRace.skillProficiencies.filter((s) => s !== 'choice')
	}, [selectedRace])

	// Speed from race
	const speed = selectedRace?.speed ?? 30

	// Proficiency bonus based on level
	const proficiencyBonus = Math.ceil(level / 4) + 1

	// Get selected class data
	const selectedClassData = useMemo(() => {
		return CLASSES.find((c) => c.id === characterClass)
	}, [characterClass])

	// Hit dice string
	const hitDiceTotal = level
	const hitDiceRemaining = hitDiceTotal - hitDiceUsed
	const hitDie = selectedClassData?.hitDie ?? 8

	function updateBaseAttribute(key: string, value: number) {
		setBaseAttributes((prev) => ({ ...prev, [key]: value }))
	}

	function randomizeAttributes() {
		setBaseAttributes(generateRandomPointBuy())
	}

	function toggleSaveProficiency(key: string) {
		setSaveProficiencies((prev) => ({ ...prev, [key]: !prev[key] }))
	}

	function cycleSkillProficiency(skill: string) {
		setSkillProficiencies((prev) => {
			const current = prev[skill] || 'none'
			const next: SkillProficiency =
				current === 'none' ? 'proficient' : current === 'proficient' ? 'expertise' : 'none'
			return { ...prev, [skill]: next }
		})
	}

	function updateWeapon(index: number, field: keyof Weapon, value: string) {
		setWeapons((prev) => {
			const updated = [...prev]
			updated[index] = { ...updated[index], [field]: value }
			return updated
		})
	}

	function addWeapon() {
		setWeapons((prev) => [...prev, { name: '', attackBonus: '', damage: '', type: '' }])
	}

	function removeWeapon(index: number) {
		setWeapons((prev) => prev.filter((_, i) => i !== index))
	}

	function updateFeat(index: number, field: keyof Feat, value: string) {
		setFeats((prev) => {
			const updated = [...prev]
			updated[index] = { ...updated[index], [field]: value }
			return updated
		})
	}

	function addFeat() {
		setFeats((prev) => [...prev, { name: '', description: '' }])
	}

	function removeFeat(index: number) {
		setFeats((prev) => prev.filter((_, i) => i !== index))
	}

	function toggleDeathSave(type: 'success' | 'failure', index: number) {
		if (type === 'success') {
			setDeathSaveSuccesses((prev) => {
				const updated = [...prev]
				updated[index] = !updated[index]
				return updated as [boolean, boolean, boolean]
			})
		} else {
			setDeathSaveFailures((prev) => {
				const updated = [...prev]
				updated[index] = !updated[index]
				return updated as [boolean, boolean, boolean]
			})
		}
	}

	function getSkillModifier(skill: { name: string; attr: string }): number {
		const attrMod = calculateModifier(attributes[skill.attr])
		const profLevel = skillProficiencies[skill.name] || 'none'
		const hasRacialProf = racialSkillProficiencies.includes(skill.name)

		let profBonus = 0
		if (profLevel === 'expertise') {
			profBonus = proficiencyBonus * 2
		} else if (profLevel === 'proficient' || hasRacialProf) {
			profBonus = proficiencyBonus
		}
		return attrMod + profBonus
	}

	function getSaveModifier(attrKey: string): number {
		const attrMod = calculateModifier(attributes[attrKey])
		const profBonus = saveProficiencies[attrKey] ? proficiencyBonus : 0
		return attrMod + profBonus
	}

	// Calculated values
	const conModifier = calculateModifier(attributes.con)
	const initiativeModifier = calculateModifier(attributes.dex) + initiativeBonus
	const passivePerception = 10 + getSkillModifier({ name: 'Perception', attr: 'wis' })

	// Suggested HP: (hit die max at level 1) + (average roll for remaining levels) + (CON mod * level)
	// Average roll = (hitDie / 2) + 1 for levels 2+
	const suggestedHP = useMemo(() => {
		if (!selectedClassData) return null
		const hd = selectedClassData.hitDie
		const avgRoll = Math.floor(hd / 2) + 1
		const firstLevelHP = hd
		const remainingLevelsHP = level > 1 ? (level - 1) * avgRoll : 0
		const conBonus = conModifier * level
		return firstLevelHP + remainingLevelsHP + conBonus
	}, [selectedClassData, level, conModifier])

	return (
		<div className="container mx-auto py-8 font-mono">
			<header className="text-center mb-8">
				<h1 className="text-3xl font-bold mb-2">character sheet builder</h1>
				<p className="text-muted-foreground">
					a little 5e character sheet builder
				</p>
			</header>

			<Card className="w-full max-w-4xl mx-auto border-2 shadow-md">
				<CardHeader className="pb-4">
					<CardDescription className="text-xs text-center">
						Racial bonuses are automatically applied. Click skills to cycle: none → proficient → expertise.
					</CardDescription>
				</CardHeader>
				<CardContent className="space-y-6">
					{/* Character Info Section */}
					<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
						<div className="sm:col-span-2 lg:col-span-1">
							<Label htmlFor="name">Character Name</Label>
							<Input
								id="name"
								value={characterName}
								onChange={(e) => setCharacterName(e.target.value)}
								placeholder="Enter name"
							/>
						</div>
						<div>
							<Label htmlFor="level">Level</Label>
							<Input
								id="level"
								type="number"
								min={1}
								max={20}
								value={level}
								onChange={(e) => setLevel(parseInt(e.target.value) || 1)}
							/>
						</div>
						<div>
							<Label htmlFor="class">Class</Label>
							<Select value={characterClass} onValueChange={setCharacterClass}>
								<SelectTrigger className="w-full">
									<SelectValue placeholder="Select class" />
								</SelectTrigger>
								<SelectContent>
									{CLASSES.map((cls) => (
										<SelectItem key={cls.id} value={cls.id}>
											{cls.name} (d{cls.hitDie})
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
						<div>
							<Label htmlFor="race">Race</Label>
							<Select value={selectedRaceId} onValueChange={setSelectedRaceId}>
								<SelectTrigger className="w-full">
									<SelectValue placeholder="Select race" />
								</SelectTrigger>
								<SelectContent>
									{racesData.races.map((race) => (
										<SelectItem key={race.id} value={race.id}>
											{race.name}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
						<div>
							<Label htmlFor="background">Background</Label>
							<Input
								id="background"
								value={background}
								onChange={(e) => setBackground(e.target.value)}
								placeholder="e.g. Soldier"
							/>
						</div>
						<div className="flex items-end gap-4">
							<div className="flex items-center gap-2">
								<Checkbox
									id="inspiration"
									checked={inspiration}
									onCheckedChange={(checked) => setInspiration(checked === true)}
								/>
								<Label htmlFor="inspiration" className="cursor-pointer">Inspiration</Label>
							</div>
							<div className="text-sm text-muted-foreground">
								Prof: <span className="font-bold text-foreground">+{proficiencyBonus}</span>
							</div>
						</div>
					</div>

					{selectedRace && (
						<div className="text-xs text-muted-foreground bg-muted p-2 border-2">
							<strong>{selectedRace.name}:</strong> Speed {selectedRace.speed}ft
							{selectedRace.attributeBonuses && (
								<span>
									{' | '}
									{Object.entries(selectedRace.attributeBonuses as unknown as Record<string, number>)
										.filter(([key]) => !key.startsWith('choice'))
										.map(([attr, bonus]) => `${attr.toUpperCase()} +${bonus}`)
										.join(', ')}
								</span>
							)}
							{racialSkillProficiencies.length > 0 && (
								<span> | Skills: {racialSkillProficiencies.join(', ')}</span>
							)}
						</div>
					)}

					<Separator />

					{/* Main Grid */}
					<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
						{/* Left Column - Attributes & Saves */}
						<div className="space-y-4">
							<div>
								<div className="flex items-center justify-between mb-2">
									<h2 className="text-sm font-bold uppercase tracking-wide">Attributes</h2>
									<button
										type="button"
										onClick={randomizeAttributes}
										aria-label="Randomize attributes using point buy"
										className="text-xs bg-accent text-accent-foreground px-3 py-1.5 border-2 hover:bg-accent/80"
									>
										Random
									</button>
								</div>
								<div className="space-y-2">
									{ATTRIBUTES.map((attr) => {
										const baseValue = baseAttributes[attr.key]
										const totalValue = attributes[attr.key]
										const mod = calculateModifier(totalValue)
										const hasBonus = totalValue !== baseValue
										return (
											<div key={attr.key} className="flex items-center gap-2">
												<label htmlFor={`attr-${attr.key}`} className="w-10 text-xs font-bold">{attr.name}</label>
												<Input
													id={`attr-${attr.key}`}
													type="number"
													min={1}
													max={20}
													value={baseValue}
													onChange={(e) => updateBaseAttribute(attr.key, parseInt(e.target.value) || 8)}
													className="w-16 text-center text-sm px-1"
												/>
												{hasBonus && (
													<span className="text-xs text-muted-foreground">→{totalValue}</span>
												)}
												<div className="w-10 text-center font-bold text-sm bg-secondary text-secondary-foreground border-2 px-2 py-1">
													{formatModifier(mod)}
												</div>
											</div>
										)
									})}
								</div>
								<div className={`text-xs mt-2 p-2 border-2 ${pointsUsed > POINT_BUY_TOTAL ? 'bg-destructive text-destructive-foreground' : pointsUsed === POINT_BUY_TOTAL ? 'bg-secondary text-secondary-foreground' : 'bg-muted'}`}>
									<strong>Point Buy:</strong> {pointsUsed} / {POINT_BUY_TOTAL}
									{pointsUsed > POINT_BUY_TOTAL && <span className="ml-2">(over budget!)</span>}
									{pointsUsed < POINT_BUY_TOTAL && <span className="ml-2">({POINT_BUY_TOTAL - pointsUsed} remaining)</span>}
								</div>
							</div>

							<div>
								<h2 className="text-sm font-bold mb-2 uppercase tracking-wide">Saving Throws</h2>
								<div className="space-y-1">
									{ATTRIBUTES.map((attr) => {
										const saveMod = getSaveModifier(attr.key)
										return (
											<div key={attr.key} className="flex items-center gap-2">
												<Checkbox
													id={`save-${attr.key}`}
													checked={saveProficiencies[attr.key] || false}
													onCheckedChange={() => toggleSaveProficiency(attr.key)}
												/>
												<Label htmlFor={`save-${attr.key}`} className="flex-1 text-xs cursor-pointer">
													{attr.fullName}
												</Label>
												<span className="font-bold text-xs w-8 text-right">{formatModifier(saveMod)}</span>
											</div>
										)
									})}
								</div>
							</div>

							<div className="text-xs bg-muted p-2 border-2">
								<strong>Passive Perception:</strong> {passivePerception}
							</div>
						</div>

						{/* Middle Column - Combat & Skills */}
						<div className="space-y-4">
							<div>
								<h2 className="text-sm font-bold mb-2 uppercase tracking-wide">Combat</h2>
								<div className="grid grid-cols-3 gap-2 mb-3">
									<div className="text-center">
										<Label htmlFor="ac" className="text-xs">AC</Label>
										<Input
											id="ac"
											type="number"
											value={armorClass}
											onChange={(e) => setArmorClass(parseInt(e.target.value) || 10)}
											className="text-center font-bold"
										/>
									</div>
									<div className="text-center">
										<Label className="text-xs">Initiative</Label>
										<div className="h-9 flex items-center justify-center font-bold bg-secondary text-secondary-foreground border-2">
											{formatModifier(initiativeModifier)}
										</div>
									</div>
									<div className="text-center">
										<Label className="text-xs">Speed</Label>
										<div className="h-9 flex items-center justify-center font-bold bg-secondary text-secondary-foreground border-2">
											{speed}ft
										</div>
									</div>
								</div>

								<div className="grid grid-cols-3 gap-2 mb-2">
									<div>
										<Label htmlFor="hp-max" className="text-xs">HP Max</Label>
										<Input
											id="hp-max"
											type="number"
											value={hitPointMax}
											onChange={(e) => setHitPointMax(parseInt(e.target.value) || 1)}
											className="text-center text-sm"
										/>
									</div>
									<div>
										<Label htmlFor="hp-current" className="text-xs">Current</Label>
										<Input
											id="hp-current"
											type="number"
											value={currentHitPoints}
											onChange={(e) => setCurrentHitPoints(parseInt(e.target.value) || 0)}
											className="text-center text-sm"
										/>
									</div>
									<div>
										<Label htmlFor="hp-temp" className="text-xs">Temp HP</Label>
										<Input
											id="hp-temp"
											type="number"
											value={tempHitPoints}
											onChange={(e) => setTempHitPoints(parseInt(e.target.value) || 0)}
											className="text-center text-sm"
										/>
									</div>
								</div>
								{suggestedHP !== null && (
									<div className="text-xs text-muted-foreground mb-3">
										Suggested HP (avg): {suggestedHP}
									</div>
								)}

								<div className="grid grid-cols-2 gap-2 mb-3">
									<div>
										<Label className="text-xs">Hit Dice</Label>
										<div className="h-9 flex items-center justify-center text-sm bg-secondary text-secondary-foreground border-2">
											{hitDiceRemaining}/{hitDiceTotal}d{hitDie}
										</div>
									</div>
									<div>
										<Label htmlFor="hit-dice-used" className="text-xs">Used</Label>
										<Input
											id="hit-dice-used"
											type="number"
											min={0}
											max={hitDiceTotal}
											value={hitDiceUsed}
											onChange={(e) => setHitDiceUsed(Math.min(parseInt(e.target.value) || 0, hitDiceTotal))}
											className="text-center text-sm"
										/>
									</div>
								</div>

								<div className="text-xs">
									<Label className="text-xs mb-1 block">Death Saves</Label>
									<div className="flex gap-4">
										<div className="flex items-center gap-1">
											<span className="text-muted-foreground">S:</span>
											{[0, 1, 2].map((i) => (
												<Checkbox
													key={`success-${i}`}
													checked={deathSaveSuccesses[i]}
													onCheckedChange={() => toggleDeathSave('success', i)}
													aria-label={`Death save success ${i + 1}`}
												/>
											))}
										</div>
										<div className="flex items-center gap-1">
											<span className="text-muted-foreground">F:</span>
											{[0, 1, 2].map((i) => (
												<Checkbox
													key={`failure-${i}`}
													checked={deathSaveFailures[i]}
													onCheckedChange={() => toggleDeathSave('failure', i)}
													aria-label={`Death save failure ${i + 1}`}
												/>
											))}
										</div>
									</div>
								</div>
							</div>

							<div>
								<h2 className="text-sm font-bold mb-2 uppercase tracking-wide">Skills</h2>
								<div className="space-y-0.5 text-xs">
									{SKILLS.map((skill) => {
										const skillMod = getSkillModifier(skill)
										const profLevel = skillProficiencies[skill.name] || 'none'
										const hasRacialProf = racialSkillProficiencies.includes(skill.name)
										const attrLabel = skill.attr.toUpperCase()
										return (
											<button
												key={skill.name}
												type="button"
												className="flex items-center gap-1 cursor-pointer hover:bg-muted px-1 py-0.5 w-full text-left"
												onClick={() => cycleSkillProficiency(skill.name)}
												aria-label={`${skill.name}: ${profLevel === 'expertise' ? 'expertise' : profLevel === 'proficient' ? 'proficient' : 'not proficient'}. Click to cycle.`}
											>
												<div className="w-4 text-center">
													{profLevel === 'expertise' ? '◆' : profLevel === 'proficient' ? '●' : hasRacialProf ? '○' : '○'}
												</div>
												<span className="flex-1">
													{skill.name} <span className="text-muted-foreground">({attrLabel})</span>
												</span>
												<span className="font-bold w-6 text-right">{formatModifier(skillMod)}</span>
											</button>
										)
									})}
								</div>
								<div className="text-xs text-muted-foreground mt-2">
									○ none · ● proficient · ◆ expertise
								</div>
							</div>
						</div>

						{/* Right Column - Weapons & Feats */}
						<div className="space-y-4">
							<div>
								<div className="flex items-center justify-between mb-2">
									<h2 className="text-sm font-bold uppercase tracking-wide">Attacks</h2>
									<button
										type="button"
										onClick={addWeapon}
										aria-label="Add weapon"
										className="text-xs bg-accent text-accent-foreground px-3 py-1.5 border-2 hover:bg-accent/80"
									>
										+ Add
									</button>
								</div>
								<div className="space-y-3">
									{weapons.map((weapon, index) => {
										const isEmpty = !weapon.name && !weapon.attackBonus && !weapon.damage && !weapon.type
										return (
											<div key={index} className="space-y-4 pb-2 border-b border-border last:border-0 last:pb-0">
												<div className="flex gap-1">
													<Input
														value={weapon.name}
														onChange={(e) => updateWeapon(index, 'name', e.target.value)}
														placeholder="Weapon"
														aria-label={`Weapon ${index + 1} name`}
														className="text-sm flex-1"
													/>
													{isEmpty && weapons.length > 1 && (
														<button
															type="button"
															onClick={() => removeWeapon(index)}
															aria-label="Remove weapon"
															className="text-sm px-2 py-1 ml-1 font-extrabold hover:bg-muted"
														>
															−
														</button>
													)}
												</div>
												<div className="grid grid-cols-3 gap-1">
<Input
													value={weapon.attackBonus}
													onChange={(e) => updateWeapon(index, 'attackBonus', e.target.value)}
													placeholder="+5"
													aria-label={`Weapon ${index + 1} attack bonus`}
													className="text-xs"
												/>
												<Input
													value={weapon.damage}
													onChange={(e) => updateWeapon(index, 'damage', e.target.value)}
													placeholder="1d8+3"
													aria-label={`Weapon ${index + 1} damage`}
													className="text-xs"
												/>
												<Input
													value={weapon.type}
													onChange={(e) => updateWeapon(index, 'type', e.target.value)}
													placeholder="Slash"
													aria-label={`Weapon ${index + 1} damage type`}
													className="text-xs"
												/>
												</div>
											</div>
										)
									})}
								</div>
							</div>

							<div>
								<div className="flex items-center justify-between mb-2">
									<h2 className="text-sm font-bold uppercase tracking-wide">Feats & Features</h2>
									<button
										type="button"
										onClick={addFeat}
										aria-label="Add feat"
										className="text-xs bg-accent text-accent-foreground px-3 py-1.5 border-2 hover:bg-accent/80"
									>
										+ Add
									</button>
								</div>
								<div className="space-y-3">
									{feats.map((feat, index) => {
										const isEmpty = !feat.name && !feat.description
										return (
											<div key={index} className="space-y-4 pb-2 border-b border-border last:border-0 last:pb-0">
												<div className="flex gap-1">
													<Input
														value={feat.name}
														onChange={(e) => updateFeat(index, 'name', e.target.value)}
														placeholder="Feat name"
														aria-label={`Feat ${index + 1} name`}
														className="text-sm flex-1"
													/>
													{isEmpty && feats.length > 1 && (
														<button
															type="button"
															onClick={() => removeFeat(index)}
															aria-label="Remove feat"
															className="text-sm px-2 py-1 ml-1 font-extrabold hover:bg-muted"
														>
															−
														</button>
													)}
												</div>
												<Input
													value={feat.description}
													onChange={(e) => updateFeat(index, 'description', e.target.value)}
													placeholder="Notes"
													aria-label={`Feat ${index + 1} description`}
													className="text-xs"
												/>
											</div>
										)
									})}
								</div>
							</div>

							<div>
								<Label htmlFor="initiative-bonus" className="text-xs">Initiative Bonus</Label>
								<Input
									id="initiative-bonus"
									type="number"
									value={initiativeBonus}
									onChange={(e) => setInitiativeBonus(parseInt(e.target.value) || 0)}
									placeholder="0"
									className="text-sm w-20"
								/>
								<p className="text-xs text-muted-foreground mt-1">
									For feats like Alert (+5)
								</p>
							</div>
						</div>
					</div>
				</CardContent>
			</Card>

			<footer className="mt-8 pt-4 border-t text-xs text-muted-foreground text-center">
				Built by{" "}
				<a
					href="https://twitter.com/elithrar"
					target="_blank"
					rel="noopener noreferrer"
					className="underline hover:text-foreground"
				>
					Matt Silverlock
				</a>
			</footer>
		</div>
	)
}
