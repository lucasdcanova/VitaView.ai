import React, { useState, useMemo } from "react";
import { useLocation } from "wouter";
import Sidebar from "@/components/layout/sidebar";
import MobileHeader from "@/components/layout/mobile-header";
import PatientHeader from "@/components/patient-header";
import { useProfiles } from "@/hooks/use-profiles";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Search,
  User,
  Calendar,
  Building2,
  Phone,
  Mail,
  Heart,
  UserPlus,
  ChevronRight,
  Users,
  Filter,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { format, differenceInYears } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Profile } from "@shared/schema";
import CreatePatientDialog from "@/components/create-patient-dialog";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
  SheetClose,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { useQuery } from "@tanstack/react-query";
import { CID10_DATABASE } from "@/data/cid10-database";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";

function calculateAge(birthDate: string | Date | null | undefined): number | null {
  if (!birthDate) return null;
  const date = typeof birthDate === 'string' ? new Date(birthDate) : birthDate;
  if (isNaN(date.getTime())) return null;
  return differenceInYears(new Date(), date);
}

export default function Patients() {
  const [, setLocation] = useLocation();
  const { profiles, isLoading, activeProfile, setActiveProfile } = useProfiles();
  const [searchTerm, setSearchTerm] = useState("");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  // Filter States
  const [genderFilter, setGenderFilter] = useState<string>("all");
  const [ageRange, setAgeRange] = useState<[number, number]>([0, 120]);
  const [selectedComorbidities, setSelectedComorbidities] = useState<string[]>([]);

  // Fetch diagnoses for filtering
  const { data: diagnoses = [] } = useQuery<any[]>({
    queryKey: ["/api/diagnoses"],
  });

  // Extract unique comorbidities present in the patients
  const availableComorbidities = useMemo(() => {
    const uniqueCids = new Set<string>();
    diagnoses.forEach((d: any) => {
      if (d.cidCode) uniqueCids.add(d.cidCode);
    });
    return Array.from(uniqueCids).map(cid => {
      const entry = CID10_DATABASE.find(c => c.code === cid);
      return {
        code: cid,
        description: entry ? entry.description : cid
      };
    }).sort((a, b) => a.description.localeCompare(b.description));
  }, [diagnoses]);

  // Filter profiles
  const filteredProfiles = useMemo(() => {
    let result = profiles;

    // 1. Search Term
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      result = result.filter((profile: Profile) => {
        const name = profile.name?.toLowerCase() || "";
        const email = profile.email?.toLowerCase() || "";
        const phone = profile.phone?.toLowerCase() || "";
        const insurance = profile.planType?.toLowerCase() || "";

        return (
          name.includes(term) ||
          email.includes(term) ||
          phone.includes(term) ||
          insurance.includes(term)
        );
      });
    }

    // 2. Gender Filter
    if (genderFilter !== "all") {
      result = result.filter((profile: Profile) => {
        if (genderFilter === "other") {
          return profile.gender !== "male" && profile.gender !== "female";
        }
        return profile.gender === genderFilter;
      });
    }

    // 3. Age Range Filter
    if (ageRange[0] > 0 || ageRange[1] < 100) {
      result = result.filter((profile: Profile) => {
        const age = calculateAge(profile.birthDate);
        if (age === null) return false; // Exclude if age is unknown? Or keep?
        return age >= ageRange[0] && age <= ageRange[1];
      });
    }

    // 4. Comorbidities Filter
    if (selectedComorbidities.length > 0) {
      result = result.filter((profile: Profile) => {
        // Find diagnoses for this profile
        const profileDiagnoses = diagnoses.filter((d: any) => d.profileId === profile.id);
        // Check if profile has ALL selected comorbidities
        return selectedComorbidities.every(cid =>
          profileDiagnoses.some((d: any) => d.cidCode === cid)
        );
      });
    }

    return result;
  }, [profiles, searchTerm, genderFilter, ageRange, selectedComorbidities, diagnoses]);

  const handleSelectPatient = (profile: Profile) => {
    setActiveProfile(profile);
  };

  const handleStartService = (profile: Profile) => {
    setActiveProfile(profile);
    setLocation("/atendimento");
  };

  const clearFilters = () => {
    setGenderFilter("all");
    setAgeRange([0, 100]);
    setSelectedComorbidities([]);
    setSearchTerm("");
  };

  const activeFiltersCount = (genderFilter !== "all" ? 1 : 0) +
    (ageRange[0] > 0 || ageRange[1] < 100 ? 1 : 0) +
    selectedComorbidities.length;

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <MobileHeader />

        <main className="flex-1 overflow-y-auto bg-background">
          <PatientHeader
            title="Pacientes"
            description="Busque e selecione um paciente para iniciar o atendimento."
            showTitleAsMain={true}
            fullWidth={true}
            icon={<Users className="h-6 w-6" />}
          >
            <div className="flex gap-2">
                <Button
                  onClick={() => setIsCreateDialogOpen(true)}
                  className="bg-charcoal hover:bg-charcoal/85 text-pureWhite border border-border/30"
                >
                  <UserPlus className="h-4 w-4 mr-2" />
                  Novo Paciente
                </Button>
            </div>
          </PatientHeader>

          <div className="p-4 md:p-6 lg:p-8">

          {/* Search and Filter Bar */}
          <div className="mb-6 flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <Input
                type="text"
                placeholder="Buscar por nome, email, telefone ou convênio..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 h-10 text-base bg-white border-gray-200 focus:border-charcoal focus:ring-charcoal"
              />
            </div>

            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" className="gap-2 relative">
                  <Filter className="h-4 w-4" />
                  Filtros
                  {activeFiltersCount > 0 && (
                    <Badge variant="secondary" className="ml-1 px-1.5 h-5 min-w-5 flex items-center justify-center bg-charcoal text-white text-xs rounded-full">
                      {activeFiltersCount}
                    </Badge>
                  )}
                </Button>
              </SheetTrigger>
              <SheetContent>
                <SheetHeader>
                  <SheetTitle>Filtrar Pacientes</SheetTitle>
                  <SheetDescription>
                    Refine sua busca utilizando os filtros abaixo.
                  </SheetDescription>
                </SheetHeader>

                <div className="py-6 space-y-6">
                  {/* Gender Filter */}
                  <div className="space-y-2">
                    <Label>Gênero</Label>
                    <Select value={genderFilter} onValueChange={setGenderFilter}>
                      <SelectTrigger>
                        <SelectValue placeholder="Todos" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos</SelectItem>
                        <SelectItem value="male">Masculino</SelectItem>
                        <SelectItem value="female">Feminino</SelectItem>
                        <SelectItem value="other">Outro</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Age Range Filter */}
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <Label>Faixa Etária</Label>
                      <span className="text-sm text-gray-500">
                        {ageRange[0]} - {ageRange[1]} anos
                      </span>
                    </div>
                    <Slider
                      defaultValue={[0, 120]}
                      value={ageRange}
                      onValueChange={(value) => setAgeRange(value as [number, number])}
                      max={120}
                      step={1}
                      className="py-4"
                    />
                  </div>

                  {/* Comorbidities Filter */}
                  <div className="space-y-3">
                    <Label>Comorbidades (Diagnósticos)</Label>
                    <ScrollArea className="h-[200px] border rounded-md p-4">
                      {availableComorbidities.length > 0 ? (
                        <div className="space-y-3">
                          {availableComorbidities.map((item) => (
                            <div key={item.code} className="flex items-start space-x-2">
                              <Checkbox
                                id={`comorb-${item.code}`}
                                checked={selectedComorbidities.includes(item.code)}
                                onCheckedChange={(checked) => {
                                  if (checked) {
                                    setSelectedComorbidities([...selectedComorbidities, item.code]);
                                  } else {
                                    setSelectedComorbidities(selectedComorbidities.filter(c => c !== item.code));
                                  }
                                }}
                              />
                              <label
                                htmlFor={`comorb-${item.code}`}
                                className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer pt-0.5"
                              >
                                <span className="font-medium text-gray-900">{item.code}</span>
                                <span className="text-gray-500 ml-1">- {item.description}</span>
                              </label>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-gray-500 text-center py-4">
                          Nenhuma comorbidade registrada nos pacientes.
                        </p>
                      )}
                    </ScrollArea>
                    <p className="text-xs text-gray-500">
                      *Exibe apenas comorbidades presentes na sua base de pacientes.
                    </p>
                  </div>
                </div>

                <SheetFooter className="flex-col sm:flex-col gap-3 sm:gap-3">
                  <SheetClose asChild>
                    <Button className="w-full bg-charcoal hover:bg-charcoal/90">
                      Aplicar Filtros
                    </Button>
                  </SheetClose>
                  {activeFiltersCount > 0 && (
                    <Button variant="outline" onClick={clearFilters} className="w-full">
                      Limpar Filtros
                    </Button>
                  )}
                </SheetFooter>
              </SheetContent>
            </Sheet>
          </div>

          {/* Stats */}
          <div className="mb-6 flex items-center gap-4 text-sm text-gray-600">
            <span className="font-medium">
              {filteredProfiles.length} paciente{filteredProfiles.length !== 1 ? 's' : ''} encontrado{filteredProfiles.length !== 1 ? 's' : ''}
            </span>
            {(activeFiltersCount > 0 || searchTerm) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                className="text-gray-500 hover:text-gray-700 h-auto p-0 px-2"
              >
                Limpar filtros <X className="h-3 w-3 ml-1" />
              </Button>
            )}
          </div>

          {/* Patients List */}
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-charcoal"></div>
            </div>
          ) : filteredProfiles.length === 0 ? (
            <div className="text-center py-12">
              <Users className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Nenhum paciente encontrado com esses filtros
              </h3>
              <p className="text-gray-500 mb-4">
                Tente ajustar os termos de busca ou remover os filtros aplicados.
              </p>
              <Button
                variant="outline"
                onClick={clearFilters}
              >
                Limpar Todos os Filtros
              </Button>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredProfiles.map((profile: Profile) => {
                const age = calculateAge(profile.birthDate);
                const isActive = activeProfile?.id === profile.id;
                const registrationDate = profile.createdAt
                  ? format(new Date(profile.createdAt), "dd/MM/yyyy", { locale: ptBR })
                  : null;

                return (
                  <Card
                    key={profile.id}
                    className={cn(
                      "cursor-pointer transition-all duration-200 hover:shadow-lg group",
                      isActive
                        ? "ring-2 ring-charcoal bg-charcoal/5"
                        : "hover:ring-1 hover:ring-gray-300"
                    )}
                    onClick={() => handleSelectPatient(profile)}
                  >
                    <CardContent className="p-4">
                      {/* Header */}
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div
                            className={cn(
                              "w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold shrink-0 border",
                              isActive
                                ? "bg-primary text-primary-foreground border-primary/40 shadow-sm"
                                : "bg-muted text-foreground border-border"
                            )}
                          >
                            {profile.name?.[0]?.toUpperCase() || "P"}
                          </div>
                          <div>
                            <h3 className="font-semibold text-gray-900 group-hover:text-charcoal transition-colors">
                              {profile.name}
                            </h3>
                            {age !== null && (
                              <p className="text-sm text-gray-500">{age} anos</p>
                            )}
                          </div>
                        </div>
                        {isActive && (
                          <Badge className="border-primary/40 bg-primary/15 text-primary dark:bg-primary/25 dark:text-primary-foreground">
                            Selecionado
                          </Badge>
                        )}
                      </div>

                      {/* Info */}
                      <div className="space-y-2 text-sm text-gray-600 mb-4">
                        {profile.planType && (
                          <div className="flex items-center gap-2">
                            <Building2 className="h-4 w-4 text-gray-400" />
                            <span>{profile.planType}</span>
                          </div>
                        )}
                        {profile.phone && (
                          <div className="flex items-center gap-2">
                            <Phone className="h-4 w-4 text-gray-400" />
                            <span>{profile.phone}</span>
                          </div>
                        )}
                        {profile.email && (
                          <div className="flex items-center gap-2">
                            <Mail className="h-4 w-4 text-gray-400" />
                            <span className="truncate">{profile.email}</span>
                          </div>
                        )}
                        {registrationDate && (
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-gray-400" />
                            <span>Paciente desde {registrationDate}</span>
                          </div>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full min-w-0 border-border text-foreground hover:bg-muted"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSelectPatient(profile);
                          }}
                        >
                          <User className="h-4 w-4 mr-1" />
                          Selecionar
                        </Button>
                        <Button
                          size="sm"
                          className="w-full min-w-0 bg-charcoal hover:bg-charcoal/85 text-pureWhite border border-border/30"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleStartService(profile);
                          }}
                        >
                          <Heart className="h-4 w-4 mr-1" />
                          Atender
                          <ChevronRight className="h-4 w-4 ml-1" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
          </div>
        </main>
      </div>

      <CreatePatientDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
      />
    </div>
  );
}
