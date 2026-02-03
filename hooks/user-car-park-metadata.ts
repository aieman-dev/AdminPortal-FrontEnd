import { useState, useEffect } from "react";
import { carParkService } from "@/services/car-park-services";
import { CarParkPhase, CarParkPackage, CarParkDepartment } from "@/type/car-park";

export function useCarParkMetadata() {
  const [phases, setPhases] = useState<CarParkPhase[]>([]);
  const [packages, setPackages] = useState<CarParkPackage[]>([]);
  const [departments, setDepartments] = useState<CarParkDepartment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadMetadata = async () => {
      setLoading(true);
      try {
        const [phaseData, pkgData, deptData] = await Promise.all([
          carParkService.getPhases(),
          carParkService.getPackages(),
          carParkService.getDepartments()
        ]);
        setPhases(phaseData);
        setPackages(pkgData);
        setDepartments(deptData);
      } finally {
        setLoading(false);
      }
    };
    loadMetadata();
  }, []);

  return { phases, packages, departments, loading };
}