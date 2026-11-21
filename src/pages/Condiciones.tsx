import React from 'react';
import { Link } from 'react-router-dom';
import LegalLayout, { LegalSection } from '../components/LegalLayout';

const linkClass =
  'text-[#5fd91f] font-medium underline underline-offset-2 hover:text-[#6ce600]';

const Condiciones: React.FC = () => {
  return (
    <LegalLayout
      title="Condiciones generales de contratación"
      updated="21 de noviembre de 2026"
      intro={
        <p>
          Estas condiciones regulan la compra del bolígrafo Vera y la suscripción al servicio Vera a
          través de weshearn.com. Se aplican conforme al Real Decreto Legislativo 1/2007 (Ley General
          para la Defensa de los Consumidores y Usuarios), la Ley 34/2002 de Servicios de la
          Sociedad de la Información y de Comercio Electrónico y la Ley 7/1998 sobre Condiciones
          Generales de la Contratación. Antes de pagar tienes que aceptarlas; te recomendamos
          guardarlas o imprimirlas.
        </p>
      }
    >
      <LegalSection title="1. Quién vende">
        <ul className="space-y-1.5">
          <li>
            <strong className="text-gray-900">Denominación social:</strong> Shearn S.L.
          </li>
          <li>
            <strong className="text-gray-900">NIF:</strong> B19984343
          </li>
          <li>
            <strong className="text-gray-900">Domicilio:</strong> Calle General Pardiñas 28, 4.º D,
            15701 Santiago de Compostela (A Coruña), España.
          </li>
          <li>
            <strong className="text-gray-900">Correo electrónico:</strong>{' '}
            <a href="mailto:info@weshearn.com" className={linkClass}>
              info@weshearn.com
            </a>
          </li>
        </ul>
      </LegalSection>

      <LegalSection title="2. Qué contratas">
        <p>Con una única compra contratas dos cosas:</p>
        <ul className="list-disc pl-5 space-y-1.5">
          <li>
            <strong className="text-gray-900">El bolígrafo Vera y 2 cuadernos Vera</strong>. El
            bolígrafo es un dispositivo físico que pasa a ser de tu propiedad.
          </li>
          <li>
            <strong className="text-gray-900">La suscripción al servicio Vera</strong>, que mientras
            esté activa incluye:
            <ul className="list-[circle] pl-5 mt-1.5 space-y-1">
              <li>
                el tutor educativo por voz que funciona con el bolígrafo a través de la aplicación
                de Vera, sin límite de uso;
              </li>
              <li>hasta 1 cuaderno Vera al mes, si lo pides;</li>
              <li>hasta 1 recambio de tinta al mes, si lo pides.</li>
            </ul>
          </li>
        </ul>
        <p>
          Los cuadernos y recambios se piden escribiendo a{' '}
          <a href="mailto:info@weshearn.com" className={linkClass}>
            info@weshearn.com
          </a>
          . Los meses en que no los pidas no se acumulan. En lugar de los cuadernos, puedes imprimir
          el papel de Vera en casa con una impresora láser; te enviamos el archivo si lo pides.
        </p>
        <p>
          Para usar Vera necesitas un móvil o tableta compatible con la aplicación de Vera, con
          Bluetooth y conexión a internet.
        </p>
      </LegalSection>

      <LegalSection title="3. Quién puede contratar">
        <p>
          La compra la tiene que hacer una persona mayor de edad, normalmente el padre, la madre o
          el tutor legal del alumno, o una academia o centro. Quien contrata es responsable del uso
          que el alumno haga del servicio.
        </p>
      </LegalSection>

      <LegalSection title="4. Precios">
        <ul className="list-disc pl-5 space-y-1.5">
          <li>
            Bolígrafo Vera: <strong className="text-gray-900">89 €</strong>, pago único.
          </li>
          <li>
            Suscripción al servicio Vera:{' '}
            <strong className="text-gray-900">30 € al mes</strong>.
          </li>
        </ul>
        <p>
          Todos los precios incluyen el IVA. Si hay gastos de envío, se muestran antes de confirmar
          el pago. El precio aplicable es el que aparece en el momento de la compra.
        </p>
      </LegalSection>

      <LegalSection title="5. Cómo se contrata">
        <p>
          Desde la página de Vera accedes a una pasarela de pago segura gestionada por Stripe
          Payments Europe, Ltd. Allí indicas tus datos, la dirección de envío y el medio de pago,
          aceptas estas condiciones y confirmas la compra. Puedes corregir cualquier dato antes de
          confirmar.
        </p>
        <p>
          Tras el pago recibirás por correo electrónico la confirmación del pedido y el recibo.
          Shearn conserva el registro del contrato y te enviará una copia si la pides en{' '}
          <a href="mailto:info@weshearn.com" className={linkClass}>
            info@weshearn.com
          </a>
          . El contrato se formaliza en español.
        </p>
      </LegalSection>

      <LegalSection title="6. Pago">
        <p>
          El pago se hace con tarjeta u otros medios que ofrezca la pasarela. Shearn no ve ni guarda
          los datos de tu tarjeta: los trata Stripe con los estándares de seguridad PCI DSS. Con
          la compra autorizas a Shearn a cobrar la cuota mensual de la suscripción en el mismo medio
          de pago mientras la suscripción esté activa.
        </p>
      </LegalSection>

      <LegalSection title="7. Suscripción: inicio, renovación y baja">
        <ul className="list-disc pl-5 space-y-1.5">
          <li>
            La primera cuota mensual se cobra cuando activas el bolígrafo en la aplicación de Vera,
            no el día de la compra. Si pasados 15 días desde la compra no lo has activado, la
            suscripción empieza igualmente ese día.
          </li>
          <li>
            La suscripción se renueva automáticamente cada mes, el mismo día en que empezó, hasta
            que la canceles.
          </li>
          <li>
            No hay permanencia. Puedes cancelar en cualquier momento desde el{' '}
            <a href="https://billing.stripe.com/p/login/bJe5kF0sl68w63R8Qc9AA00" className={linkClass}>
              portal de cliente
            </a>{' '}
            (entras con el correo que usaste al comprar), desde el enlace que recibes en los correos
            de la suscripción o escribiendo a{' '}
            <a href="mailto:info@weshearn.com" className={linkClass}>
              info@weshearn.com
            </a>
            . La baja tiene efecto al final del mes ya pagado y no se cobran más cuotas.
          </li>
          <li>
            Si cambiamos el precio de la suscripción te avisaremos por correo con al menos 30 días
            de antelación, y podrás cancelar antes de que se aplique.
          </li>
          <li>
            Si un cobro falla y no se resuelve, podemos suspender el servicio hasta que se
            regularice el pago.
          </li>
        </ul>
      </LegalSection>

      <LegalSection title="8. Envío y entrega">
        <p>
          Enviamos a direcciones de España, por correo y sin gastos de envío. El bolígrafo y los
          cuadernos de la compra los entregamos lo antes posible y, en todo caso, en un plazo
          máximo de 30 días naturales desde la compra. Si no podemos cumplir ese plazo te avisaremos
          y podrás cancelar el pedido con reembolso íntegro. Los cuadernos y recambios de la
          suscripción los enviamos cuando los pidas.
        </p>
      </LegalSection>

      <LegalSection title="9. Derecho de desistimiento (14 días)">
        <p>
          Como consumidor, tienes derecho a desistir del contrato en un plazo de{' '}
          <strong className="text-gray-900">14 días naturales</strong> sin necesidad de
          justificación. El plazo cuenta:
        </p>
        <ul className="list-disc pl-5 space-y-1.5">
          <li>para el bolígrafo, desde el día en que tú, o quien indiques, lo recibes;</li>
          <li>para la suscripción, desde el día de la compra.</li>
        </ul>
        <p>
          Para ejercerlo, comunícanoslo de forma inequívoca antes de que acabe el plazo, por ejemplo
          escribiendo a{' '}
          <a href="mailto:info@weshearn.com" className={linkClass}>
            info@weshearn.com
          </a>{' '}
          o por correo postal a la dirección del apartado 1. Puedes usar el formulario modelo que
          aparece al final, aunque no es obligatorio.
        </p>
        <p>
          <strong className="text-gray-900">Consecuencias.</strong> Te devolveremos todos los pagos
          recibidos, incluidos los gastos de envío ordinarios, en un máximo de 14 días naturales
          desde que nos comuniques tu decisión, usando el mismo medio de pago, sin ningún coste para
          ti. Podemos retener el reembolso del bolígrafo hasta haberlo recibido o hasta que nos
          acredites que lo has enviado.
        </p>
        <p>
          Debes devolver el bolígrafo, con sus accesorios, a la dirección del apartado 1 en un
          máximo de 14 días naturales desde que nos comuniques el desistimiento. El coste directo
          de la devolución corre de tu cuenta. Solo respondes de la pérdida de valor del bolígrafo
          si se debe a un uso distinto del necesario para comprobar su naturaleza y funcionamiento.
        </p>
        <p>
          Si activas el bolígrafo y empiezas a usar el servicio antes de que termine el plazo de
          desistimiento, nos pides expresamente que el servicio empiece en ese momento. Si después
          desistes, solo pagarás la parte proporcional del servicio prestado hasta que nos lo
          comuniques.
        </p>
      </LegalSection>

      <LegalSection title="10. Garantía">
        <p>
          El bolígrafo tiene la garantía legal de conformidad de 3 años desde la entrega. El
          servicio Vera debe ser conforme durante todo el tiempo que esté contratado. Si algo no
          funciona como debe, escríbenos a{' '}
          <a href="mailto:info@weshearn.com" className={linkClass}>
            info@weshearn.com
          </a>{' '}
          y lo repararemos, lo sustituiremos o, si no es posible, te reduciremos el precio o
          resolveremos el contrato, según la ley.
        </p>
      </LegalSection>

      <LegalSection title="11. Uso del servicio">
        <p>
          Vera es una herramienta de apoyo al estudio basada en inteligencia artificial. Puede
          equivocarse y no sustituye al profesorado. Te comprometes a usarla de forma lícita y a no
          manipular el bolígrafo ni la aplicación para fines distintos de los previstos.
        </p>
        <p>
          El tratamiento de datos personales se rige por la{' '}
          <Link to="/privacidad" className={linkClass}>
            política de privacidad
          </Link>
          .
        </p>
      </LegalSection>

      <LegalSection title="12. Atención al cliente y reclamaciones">
        <p>
          Puedes hacernos cualquier consulta o reclamación en{' '}
          <a href="mailto:info@weshearn.com" className={linkClass}>
            info@weshearn.com
          </a>
          . Te responderemos lo antes posible y, en todo caso, en un plazo máximo de un mes. También
          tienes a tu disposición hojas de reclamación oficiales y puedes acudir a los servicios de
          consumo de tu comunidad autónoma.
        </p>
      </LegalSection>

      <LegalSection title="13. Cambios en estas condiciones">
        <p>
          Podemos actualizar estas condiciones. A cada compra se le aplican las vigentes en el
          momento de hacerla. Los cambios que afecten a una suscripción en curso te los
          comunicaremos por correo con antelación y podrás cancelar si no estás de acuerdo.
        </p>
      </LegalSection>

      <LegalSection title="14. Ley aplicable y jurisdicción">
        <p>
          Estas condiciones se rigen por la ley española. Si eres consumidor, los tribunales
          competentes son los de tu domicilio.
        </p>
      </LegalSection>

      <LegalSection title="Anexo. Formulario de desistimiento">
        <p className="text-sm">
          (Solo tienes que rellenar y enviar este formulario si quieres desistir del contrato.)
        </p>
        <div className="rounded-xl border border-gray-200 bg-white/70 p-5 text-sm space-y-2">
          <p>
            A la atención de Shearn S.L., Calle General Pardiñas 28, 4.º D, 15701 Santiago de
            Compostela (A Coruña), info@weshearn.com:
          </p>
          <p>
            Por la presente le comunico que desisto de mi contrato de venta del siguiente bien y de
            prestación del siguiente servicio: bolígrafo Vera con 2 cuadernos y suscripción al servicio Vera.
          </p>
          <p>Pedido el / recibido el: ____________________</p>
          <p>Nombre del consumidor: ____________________</p>
          <p>Domicilio del consumidor: ____________________</p>
          <p>Firma del consumidor (solo si el formulario se presenta en papel): ____________________</p>
          <p>Fecha: ____________________</p>
        </div>
      </LegalSection>
    </LegalLayout>
  );
};

export default Condiciones;
