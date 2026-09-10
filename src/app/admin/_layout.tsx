import { Tabs, type BottomTabBarProps } from 'expo-router/js-tabs';
import { LayoutDashboard, Menu, Receipt, Users } from 'lucide-react-native';
import { useCallback } from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { RutaProtegida } from '@/features/auth/components';
import type { Rol } from '@/features/auth/types';
import { HojaGuia } from '@/features/onboarding/components';
import type { TabAdmin } from '@/features/onboarding/types';
import { BarraTabs, espacioDeBarra, type TabDefinido } from '@/shared/ui/atoms';
import { useEstiloTabs, useTheme, type Theme } from '@/theme';

/**
 * Quien puede entrar al area de administrador.
 *
 * `super_admin` esta de forma TEMPORAL, mientras su propia seccion no existe:
 * `INICIO_POR_ROL` (en `features/auth/rutas.ts`) lo manda aca, asi que si no
 * estuviera en esta lista el guard lo rebotaria en un loop infinito. Los dos
 * lugares se cambian juntos el dia que se arme el area de super admin.
 */
const ROLES_PERMITIDOS: readonly Rol[] = ['administrador', 'super_admin'];

/**
 * Los tabs en el ORDEN en que se dibujan. Es la fuente de verdad del orden: lo
 * usa la barra para repartir el ancho y la hoja del tour para saber sobre cual
 * poner el halo.
 */
const TABS: readonly TabDefinido[] = [
  { ruta: 'index', etiqueta: 'Dashboard', Icono: LayoutDashboard },
  { ruta: 'facturas', etiqueta: 'Facturas', Icono: Receipt },
  { ruta: 'clientes', etiqueta: 'Clientes', Icono: Users },
  { ruta: 'cuenta', etiqueta: 'Mas', Icono: Menu },
];

const RUTAS_TABS = TABS.map((tab) => tab.ruta) as readonly TabAdmin[];

/**
 * Barra de tabs del administrador: su trabajo del dia (dashboard, facturas,
 * clientes) mas un "Mas" donde va todo lo demas.
 *
 * La barra la dibuja `BarraTabs` en vez del navegador, en el estilo que el
 * cliente haya elegido en Configuracion. El header del navegador va apagado:
 * cada pantalla dibuja su propio encabezado con el atom `Pantalla`.
 */
export default function AdminLayout() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { estilo } = useEstiloTabs();
  const styles = createStyles(theme);

  const dibujarBarra = useCallback(
    (props: BottomTabBarProps) => <BarraTabs {...props} tabs={TABS} />,
    [],
  );

  return (
    <RutaProtegida roles={ROLES_PERMITIDOS}>
      {/* El View existe para que la hoja del tour pueda flotar por encima de
          los tabs: es el marco contra el que se posiciona. */}
      <View style={styles.raiz}>
        <Tabs
          tabBar={dibujarBarra}
          screenOptions={{
            headerShown: false,
            /*
             * Al salir de un tab, su stack vuelve al principio. Sin esto, entrar
             * a la ficha de un cliente y cambiar de tab deja esa ficha abierta:
             * al volver a Clientes aparece un cliente en vez de la lista, y la
             * flecha de atras tiene que desandar un camino que ya no se ve.
             *
             * Un tab es un lugar al que se va, no una pantalla que se recuerda.
             */
            popToTopOnBlur: true,
            // El alto se fija a mano (sale del estilo elegido) porque no lo usa
            // solo la barra: la hoja del tour se apoya justo encima y necesita
            // el mismo numero. Ver `espacioDeBarra`.
            tabBarStyle: { height: espacioDeBarra(estilo, insets.bottom) },
          }}
        >
          {/* La etiqueta la dibuja `BarraTabs`; el `title` sigue aca porque es
              lo que usa el navegador para el titulo del documento en web. */}
          {TABS.map((tab) => (
            <Tabs.Screen key={tab.ruta} name={tab.ruta} options={{ title: tab.etiqueta }} />
          ))}
        </Tabs>

        <HojaGuia tabs={RUTAS_TABS} />
      </View>
    </RutaProtegida>
  );
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    raiz: { flex: 1, backgroundColor: theme.colors.background },
  });
